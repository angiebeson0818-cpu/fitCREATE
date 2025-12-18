
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, DragEvent } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon, CameraIcon, PlusIcon, ChevronDownIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  onBatchAddGarments?: (files: File[]) => void;
  onReferenceSelect: (referenceFile: File) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, onBatchAddGarments, onReferenceSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDraggingUpload, setIsDraggingUpload] = useState(false);

    const categories = useMemo(() => {
        const allCats = wardrobe
            .map(item => item.category)
            .filter((c): c is string => !!c)
            .map(c => c.charAt(0).toUpperCase() + c.slice(1));
        const uniqueCats = [...new Set(allCats)];
        return ['All', ...uniqueCats];
    }, [wardrobe]);
    
    const filteredWardrobe = useMemo(() => {
        let items = wardrobe;

        if (selectedCategory !== 'All') {
            items = items.filter(item => item.category?.toLowerCase() === selectedCategory.toLowerCase());
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.category?.toLowerCase().includes(query) ||
                item.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return items;
    }, [wardrobe, selectedCategory, searchQuery]);

    const sortedWardrobe = useMemo(() => {
        const sorted = [...filteredWardrobe];
        
        switch (sortOption) {
            case 'newest':
                return sorted.reverse();
            case 'oldest':
                return sorted;
            case 'az':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'za':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return sorted;
        }
    }, [filteredWardrobe, sortOption]);

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            setError(`Failed to load wardrobe item. Check console for details.`);
            console.error(err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
           processFiles(Array.from(e.target.files));
           e.target.value = '';
        }
    };

    const processFiles = (fileList: File[]) => {
        const files = fileList.filter(f => f.type.startsWith('image/'));
        if (files.length === 0) {
            setError('Please select valid image files.');
            return;
        }

        if (files.length > 1 && onBatchAddGarments) {
            onBatchAddGarments(files);
        } else {
            const file = files[0];
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name.split('.')[0],
                url: URL.createObjectURL(file),
                category: 'custom',
                tags: ['custom']
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };

    const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            onReferenceSelect(file);
            e.target.value = '';
        }
    };

    const handleDragOverUpload = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDraggingUpload) setIsDraggingUpload(true);
    };

    const handleDragLeaveUpload = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingUpload(false);
    };

    const handleDropUpload = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingUpload(false);
        if (isLoading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    const handleItemDragStart = (e: DragEvent<HTMLButtonElement>, item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) {
            e.preventDefault();
            return;
        }
        // Store item ID in dataTransfer for the Canvas drop target
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'copy';
        
        // Visual feedback
        const dragImage = new Image();
        dragImage.src = item.url;
        e.dataTransfer.setDragImage(dragImage, 32, 32);
    };

  return (
    <div className="pt-6 border-t border-gray-400/50 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl font-serif tracking-wider text-gray-800">My Wardrobe</h2>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{wardrobe.length} items</span>
        </div>
        
        <div className="overflow-y-auto flex-grow pr-1 pb-4">
            <label 
                onDragOver={handleDragOverUpload}
                onDragLeave={handleDragLeaveUpload}
                onDrop={handleDropUpload}
                className={`
                flex flex-col items-center justify-center w-full p-6 mb-6
                border-2 border-dashed rounded-xl transition-all cursor-pointer group
                ${isDraggingUpload 
                    ? 'border-brand-terracotta bg-brand-terracotta/5 scale-[1.02] shadow-md' 
                    : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-brand-terracotta/50 hover:shadow-sm'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
                <div className={`w-12 h-12 bg-white rounded-full shadow-sm border flex items-center justify-center mb-3 transition-all ${isDraggingUpload ? 'scale-110 border-brand-terracotta/20' : 'border-gray-100 group-hover:scale-110 group-hover:border-brand-terracotta/20'}`}>
                    <PlusIcon className="w-6 h-6 text-brand-terracotta" />
                </div>
                <h3 className={`text-sm font-bold transition-colors ${isDraggingUpload ? 'text-brand-terracotta' : 'text-gray-800 group-hover:text-brand-terracotta'}`}>
                    {isDraggingUpload ? 'Drop to Upload' : 'Add New Garments'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{isDraggingUpload ? 'Release to upload' : 'Click or Drag & Drop here'}</p>
                <input 
                    type="file" 
                    className="hidden" 
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                    onChange={handleFileChange} 
                    disabled={isLoading}
                />
            </label>

            <div className="flex flex-col gap-3 mb-4">
                <input 
                    type="text"
                    placeholder="Search garments or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-terracotta bg-gray-50/50"
                />

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map(category => (
                        <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors border ${
                            selectedCategory === category
                            ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        >
                        {category}
                        </button>
                    ))}
                </div>
                
                <div className="flex justify-end">
                    <div className="relative inline-block text-left w-32">
                        <select 
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="block w-full pl-3 pr-8 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-terracotta appearance-none cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="az">Name (A-Z)</option>
                            <option value="za">Name (Z-A)</option>
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-3 w-3" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {sortedWardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                return (
                    <button
                    key={item.id}
                    onClick={() => handleGarmentClick(item)}
                    draggable={!isLoading && !isActive}
                    onDragStart={(e) => handleItemDragStart(e, item)}
                    disabled={isLoading || isActive}
                    className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-terracotta group disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md hover:border-brand-sand cursor-grab active:cursor-grabbing"
                    aria-label={`Select ${item.name}`}
                    >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <p className="text-white text-[10px] font-bold text-center line-clamp-2 leading-tight">{item.name}</p>
                    </div>
                    {isActive && (
                        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center backdrop-blur-[1px]">
                            <CheckCircleIcon className="w-8 h-8 text-white shadow-sm" />
                        </div>
                    )}
                    </button>
                );
                })}
            </div>
            
            {sortedWardrobe.length === 0 && (
                 <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                    <p className="text-sm text-gray-500">No items found.</p>
                 </div>
            )}

            <div className="mt-8 border-t border-gray-200 pt-5">
                 <h3 className="text-sm font-serif font-bold text-gray-800 mb-3">Complete Outfit Transfer</h3>
                 <label className={`flex items-center gap-3 p-3 border border-brand-sand/50 rounded-xl bg-brand-warm/30 hover:bg-brand-warm hover:border-brand-sand hover:shadow-sm transition-all cursor-pointer group ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-brand-sand/30 flex items-center justify-center text-brand-terracotta shadow-sm group-hover:scale-110 transition-transform">
                        <CameraIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-terracotta transition-colors">Upload Reference Image</p>
                        <p className="text-xs text-gray-500">Apply a full look from a photo</p>
                    </div>
                     <input 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                        onChange={handleReferenceFileChange} 
                        disabled={isLoading}
                    />
                </label>
            </div>

            {error && <p className="text-brand-rose text-sm mt-4 font-medium px-1">{error}</p>}
        </div>
    </div>
  );
};

export default WardrobePanel;
