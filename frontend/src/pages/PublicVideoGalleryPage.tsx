import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Film, Lock, MessageSquare, Send } from 'lucide-react';
import { api } from '../config/api';
import { FotoDeskLogo } from '../components/common/FotoDeskLogo';

interface VideoItem {
  id: number;
  title: string;
  duration_sec: number;
  mime_type?: string;
}

interface VideoComment {
  id: number;
  author_name: string;
  timestamp_sec: number;
  comment_text: string;
  created_at: string;
}

function formatSec(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const PublicVideoGalleryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{
    id: number;
    title: string;
    slug: string;
    clientName?: string;
    isProtected: boolean;
  } | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [currentSec, setCurrentSec] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get(`/public/video-galleries/${slug}`)
      .then((res) => {
        const g = res.data?.gallery;
        setGallery(g);
        const list = res.data?.videos || [];
        setVideos(list);
        if (!g?.isProtected) {
          setUnlocked(true);
          if (list.length > 0) setActiveVideoId(list[0].id);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.error || 'Galerie vidéo introuvable.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || !unlocked || !activeVideoId) return;
    api
      .get(`/public/video-galleries/${slug}/videos/${activeVideoId}/comments`)
      .then((res) => setComments(res.data?.comments || []))
      .catch(() => setComments([]));
  }, [slug, unlocked, activeVideoId]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setCodeError(null);
    try {
      const res = await api.post(`/public/video-galleries/${slug}/verify-code`, { code: codeInput });
      const list = res.data?.videos || [];
      setVideos(list);
      setUnlocked(true);
      if (list.length > 0) setActiveVideoId(list[0].id);
    } catch (err: any) {
      setCodeError(err?.response?.data?.error || "Code d'accès invalide.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !activeVideoId || !authorName.trim() || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const ts = Math.floor(videoRef.current?.currentTime ?? currentSec);
      const res = await api.post(`/public/video-galleries/${slug}/videos/${activeVideoId}/comments`, {
        authorName: authorName.trim(),
        timestampSec: ts,
        commentText: commentText.trim(),
      });
      if (res.data?.comment) {
        setComments((prev) =>
          [...prev, res.data.comment].sort((a, b) => a.timestamp_sec - b.timestamp_sec)
        );
      }
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-sm text-muted">
        Chargement de la galerie vidéo…
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-8 h-8 text-muted mb-3" />
        <h1 className="text-lg font-semibold text-heading">Galerie indisponible</h1>
        <p className="text-sm text-muted mt-1">{error || 'Cette galerie n’existe pas ou a expiré.'}</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-panel border border-line rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <FotoDeskLogo size={24} />
            <div>
              <h1 className="text-base font-semibold text-heading">{gallery.title}</h1>
              {gallery.clientName && <p className="text-xs text-muted">{gallery.clientName}</p>}
            </div>
          </div>
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <label className="block text-xs font-medium text-heading">
              Code d&apos;accès privé
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Saisissez votre code d'accès"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-line bg-canvas text-sm text-heading"
                required
              />
            </div>
            {codeError && <p className="text-xs text-red-600 dark:text-red-400">{codeError}</p>}
            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Accéder à la galerie
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeVideo = videos.find((v) => v.id === activeVideoId) || null;

  return (
    <div className="min-h-screen bg-canvas text-body">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <header className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <FotoDeskLogo size={26} />
            <div>
              <h1 className="text-lg font-semibold text-heading">{gallery.title}</h1>
              {gallery.clientName && <p className="text-xs text-muted">{gallery.clientName}</p>}
            </div>
          </div>
          <span className="text-xs text-muted">{videos.length} vidéo(s)</span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="aspect-video rounded-xl border border-line bg-black overflow-hidden flex items-center justify-center">
              {activeVideo ? (
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-full"
                  onTimeUpdate={(e) => setCurrentSec(Math.floor(e.currentTarget.currentTime))}
                />
              ) : (
                <div className="text-xs text-neutral-400">Aucune vidéo disponible dans cette galerie.</div>
              )}
            </div>

            {videos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {videos.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVideoId(v.id)}
                    className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      v.id === activeVideoId
                        ? 'border-amber-500 bg-panel'
                        : 'border-line bg-panel/60 hover:bg-hover'
                    }`}
                  >
                    <span className="text-xs font-medium text-heading truncate">{v.title}</span>
                    <span className="text-[11px] text-muted tabular-nums">{formatSec(v.duration_sec)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 bg-panel border border-line rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted" />
                Commentaires horodatés
              </h2>
              <span className="text-[11px] text-muted tabular-nums">{formatSec(currentSec)}</span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-muted">Aucun commentaire pour le moment.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-line bg-canvas/60 p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-heading">{c.author_name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) videoRef.current.currentTime = c.timestamp_sec;
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        {formatSec(c.timestamp_sec)}
                      </button>
                    </div>
                    <p className="text-xs text-body">{c.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            {activeVideo && (
              <form onSubmit={handleAddComment} className="space-y-2.5 pt-2 border-t border-line">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full h-9 px-3 rounded-lg border border-line bg-canvas text-xs text-heading"
                  required
                />
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Note à ${formatSec(currentSec)}…`}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-line bg-canvas text-xs text-heading resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="w-full h-9 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ajouter un commentaire
                </button>
              </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PublicVideoGalleryPage;
