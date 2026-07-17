import { redirect } from "next/navigation";
import { defaultAlbumSlug } from "@/lib/albums";

export default function PhotosIndexPage() {
  redirect(`/photos/${defaultAlbumSlug}`);
}
