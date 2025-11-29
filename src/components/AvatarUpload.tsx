"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera } from "lucide-react";

type AvatarUploadProps = {
    userId: string;
    currentAvatarUrl?: string | null;
    onUploadComplete: (url: string) => void;
};

export default function AvatarUpload({ userId, currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();
    const inputId = useId();

    const saveAvatarUrl = async (url: string) => {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', userId);

        if (updateError) {
            throw updateError;
        }
        onUploadComplete(url);
    };

    const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            event.target.value = "";

            let uploadedUrl: string | null = null;
            try {
                const fileExt = file.name.split('.').pop();
                const uniqueSuffix = typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2);
                const fileName = `${userId}-${uniqueSuffix}.${fileExt || "jpg"}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file, {
                        upsert: true,
                        cacheControl: '3600',
                        contentType: file.type,
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                uploadedUrl = publicUrl;
            } catch (storageError) {
                console.warn('Storage upload failed, falling back to inline avatar', storageError);
            }

            if (uploadedUrl) {
                await saveAvatarUrl(uploadedUrl);
            } else {
                const inlineImage = await fileToDataUrl(file);
                await saveAvatarUrl(inlineImage);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('画像のアップロードに失敗しました');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                id={inputId}
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
            />
            <label
                htmlFor={inputId}
                className="absolute bottom-0 right-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
            >
                {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Camera size={16} className="text-white" />
                )}
            </label>
        </div>
    );
}
