
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Request blocked: ${response.promptFeedback.blockReason}`);
    }
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }
    throw new Error("The AI model did not return an image. Please try a different request.");
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const PRIMARY_MODEL = 'gemini-3-pro-image-preview';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = "Expert fashion photography. Transform person into a full-body studio model. Clean gray backdrop. Sassy, confident, smiling expression. Return ONLY the image.";
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    const prompt = `Virtual try-on. Replace model's clothes with provided garments. Force change. Match lighting. Return ONLY image.`;
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnFromReference = async (modelImageUrl: string, referenceImage: File): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const referenceImagePart = await fileToPart(referenceImage);
    const prompt = `EXPERT OUTFIT TRANSFER. 
    1. Detect ALL items in reference: headwear, accessories, tops, bottoms, and SHOES.
    2. Correct lengths: If reference has pants (long), use pants. If shorts (short), use shorts.
    3. Mandatory matching shoes on BOTH feet. 
    4. Maintain model's face, body proportions, and background perfectly. The pose must remain EXACTLY as it is in the model image.
    5. Ensure the result is DIFFERENT from the input model image.
    Return ONLY final photorealistic image.`;

    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [modelImagePart, referenceImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const generateAIRetouch = async (imageUrl: string, options: string): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `AI Beauty Retouch: ${options}. High-end professional retouching. Smooth skin while keeping texture, whiten teeth, remove blemishes, reduce wrinkles, brighten eyes, mattify skin. Return ONLY image.`;
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const applyMakeupSet = async (imageUrl: string, style: string): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `Virtual Makeup Vanity: Apply the '${style}' makeup look. Include detailed contour, highlight, eyeliner, long lashes, lipstick color matching the vibe, and eyeshdadow. Return ONLY image.`;
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const sculptBody = async (imageUrl: string, instruction: string): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `Body Sculpting & Muscle Definition: ${instruction}. Naturally and realistically adjust body proportions, add muscle definition or modify physique realistically. Preserve facial features perfectly. Return ONLY image.`;
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const applyStyleTemplate = async (imageUrl: string, template: string): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `Creative Template: ${template}. Transform this image into the requested style:
    - Cyberpunk/Cyber/Mechanic: High tech, neon, mechanical parts.
    - Anime: Stylized anime or teardrop anime.
    - Starbucks: Holding a Starbucks coffee in a lifestyle setting.
    - Polaroid Kiss: Lip print polaroid effect.
    - Double Exposure: Artistic overlay with nature or sky.
    - Good Vibes Sky: Standing in front of a majestic sunset with 'Good Vibes' written in clouds.
    - Christmas/Birthday/Couple: Seasonal frames and themes.
    Return ONLY photorealistic or stylized image as appropriate.`;
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `Photography perspective change: ${poseInstruction}. Keep person, clothes, and background identical. Return ONLY image.`;
    const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    return handleApiResponse(response);
};
