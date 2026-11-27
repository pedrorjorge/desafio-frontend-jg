import { z } from "zod";

export const avatarMaxBytes = 512 * 1024;
export const avatarTypes = ["image/png", "image/jpeg", "image/webp"];

function validAvatar(value: string) {
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([a-z\d+/]+={0,2})$/i.exec(value);
  if (!match) return false;
  const [, mime, encoded] = match;
  if (
    encoded.length > 4 * Math.ceil(avatarMaxBytes / 3) ||
    encoded.length % 4 !== 0
  )
    return false;
  const byteCount =
    (encoded.length * 3) / 4 -
    (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
  if (byteCount > avatarMaxBytes) return false;
  const prefix = atob(encoded.slice(0, 16));
  if (mime === "image/png") return prefix.startsWith("\x89PNG\r\n\x1a\n");
  if (mime === "image/jpeg") return prefix.startsWith("\xff\xd8\xff");
  return prefix.startsWith("RIFF") && prefix.slice(8, 12) === "WEBP";
}

export const avatarDataSchema = z
  .string()
  .refine(validAvatar, "Selecione uma imagem PNG, JPEG ou WebP de até 512 KiB.")
  .nullable();

export async function readAvatar(file: File) {
  if (
    !avatarTypes.includes(file.type) ||
    file.size === 0 ||
    file.size > avatarMaxBytes
  ) {
    throw new Error("Selecione uma imagem PNG, JPEG ou WebP de até 512 KiB.");
  }
  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Não foi possível ler a imagem."));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
  const dataUrl = avatarDataSchema.parse(result);
  if (dataUrl === null) throw new Error("Arquivo de avatar vazio.");
  const preview = new Image();
  preview.src = dataUrl;
  await preview.decode();
  return dataUrl;
}
