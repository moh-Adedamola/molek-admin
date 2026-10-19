import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { galleriesAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/toastContext";
import { useConfirm } from "../components/ui/confirmContext";

const MAX_BYTES = 50 * 1024 * 1024;
const OK_TYPE = /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime))$/; // same as the create form
const field = "w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-blue-600";

/** Edit an existing album: change its title/description, add photos, remove photos. */
export function GalleryEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();
    const [gallery, setGallery] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const load = async () => {
        try {
            const res = await galleriesAPI.get(id);
            setGallery(res.data);
            setTitle(res.data.title || "");
            setDescription(res.data.description || "");
        } catch {
            setLoadError(true);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when the album changes
    useEffect(() => { load(); }, [id]);

    const saveDetails = async (e) => {
        e.preventDefault();
        if (!title.trim()) { toast.error("Give the album a title."); return; }
        setBusy(true);
        try {
            await galleriesAPI.patch(id, { title: title.trim(), description: description.trim() });
            toast.success("Album details saved.");
            await load();
        } catch {
            toast.error("Could not save the album details. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const pickFiles = (e) => {
        const chosen = [...(e.target.files || [])];
        const bad = chosen.find((f) => !OK_TYPE.test(f.type) || f.size > MAX_BYTES);
        if (bad) {
            toast.error(`"${bad.name}" can't be added: use JPG, PNG or WEBP photos, or MP4/MOV videos, under 50 MB.`);
            e.target.value = "";
            return;
        }
        setFiles(chosen);
    };

    const addPhotos = async () => {
        if (!files.length) return;
        setBusy(true);
        try {
            const form = new FormData();
            files.forEach((f) => form.append("media", f));
            await galleriesAPI.addImages(id, form);
            toast.success(`${files.length} file(s) added to the album.`);
            setFiles([]);
            await load();
        } catch {
            toast.error("Could not add the files. Check your connection and try again.");
        } finally {
            setBusy(false);
        }
    };

    const removePhoto = async (image) => {
        if (!(await confirm({ title: "Remove this photo?", message: "It will be removed from the album on the website.", confirmLabel: "Remove", danger: true }))) return;
        try {
            await galleriesAPI.removeImage(id, image.id);
            toast.success("Photo removed.");
            await load();
        } catch {
            toast.error("Could not remove the photo. Please try again.");
        }
    };

    if (loadError) {
        return <div className="max-w-3xl mx-auto"><p role="alert" className="text-red-700 font-semibold">Could not load this album. Go back and try again.</p></div>;
    }
    if (!gallery) return <p role="status" className="py-16 text-center text-gray-600">Loading…</p>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button type="button" onClick={() => navigate("/galleries")} className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:underline">
                <ArrowLeft size={18} aria-hidden="true" /> Back to galleries
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit album</h1>

            <form onSubmit={saveDetails} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                    <label htmlFor="g-title" className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
                </div>
                <div>
                    <label htmlFor="g-desc" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea id="g-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
                </div>
                <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save details"}</Button>
            </form>

            <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4" aria-labelledby="photos-heading">
                <h2 id="photos-heading" className="text-lg font-bold text-gray-900">Photos and videos ({gallery.images?.length || 0})</h2>
                {gallery.images?.length ? (
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {gallery.images.map((img, i) => (
                            <li key={img.id} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                {/\.(mp4|mov|webm)(\?|$)/i.test(img.image_url)
                                    ? <video src={img.image_url} className="w-full h-32 object-cover" muted aria-label={`Video ${i + 1}`} />
                                    : <img src={img.image_url} alt={img.caption || `Photo ${i + 1}`} className="w-full h-32 object-cover" loading="lazy" />}
                                <button type="button" onClick={() => removePhoto(img)} aria-label={`Remove ${img.caption || `photo ${i + 1}`}`}
                                    className="absolute top-2 right-2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/95 text-red-700 shadow hover:bg-white">
                                    <Trash2 size={16} aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-600">This album has no photos yet.</p>}

                <div className="border-t border-gray-100 pt-4">
                    <label htmlFor="g-files" className="block text-sm font-semibold text-gray-700 mb-1">Add photos or videos</label>
                    <input id="g-files" type="file" multiple accept="image/*,video/*" onChange={pickFiles} className="block w-full text-sm" />
                    {files.length > 0 && <p className="mt-2 text-gray-700">{files.length} file(s) ready to add.</p>}
                    <div className="mt-3">
                        <Button type="button" onClick={addPhotos} disabled={busy || !files.length}>
                            <Upload size={16} aria-hidden="true" className="inline mr-1" /> {busy ? "Uploading…" : "Add to album"}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
