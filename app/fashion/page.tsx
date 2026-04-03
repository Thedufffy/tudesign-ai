"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "admin" | "client";

type User = {
  id: string;
  companyName: string;
  username: string;
  credits: number;
  isActive: boolean;
  role: Role;
  generatedCount?: number;
};

const countries = [
  "Türkiye",
  "Fransa",
  "İtalya",
  "İngiltere",
  "Amerika",
  "Birleşik Arap Emirlikleri",
  "Mısır",
  "Almanya",
  "Norveç",
  "İskandinav",
  "Fas",
  "Diğer",
] as const;

type UploadKey =
  | "topwear"
  | "bottomwear"
  | "dress"
  | "outerwear"
  | "shoes"
  | "bag"
  | "jewelry";

const uploadLabels: Record<UploadKey, string> = {
  topwear: "Üst Giyim",
  bottomwear: "Alt Giyim",
  dress: "Elbise",
  outerwear: "Mont / Dış Giyim",
  shoes: "Ayakkabı",
  bag: "Çanta",
  jewelry: "Takı / Aksesuar",
};

const uploadDescriptions: Record<UploadKey, string> = {
  topwear: "Ceket, gömlek, bluz, trikolar",
  bottomwear: "Pantolon, etek, şort",
  dress: "Tek parça elbise ürünleri",
  outerwear: "Mont, kaban, trençkot",
  shoes: "Topuklu, sneaker, bot",
  bag: "El çantası, omuz çantası",
  jewelry: "Kolye, küpe, bileklik, gözlük",
};

type AdminListUser = {
  id: string;
  companyName: string;
  username: string;
  credits: number;
  generatedCount: number;
  isActive: boolean;
  role: Role;
};

function downloadImage(src: string, filename: string) {
  const link = document.createElement("a");
  link.href = src;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function UploadCard({
  type,
  label,
  description,
  file,
  preview,
  onFileChange,
  onRemove,
}: {
  type: UploadKey;
  label: string;
  description: string;
  file?: File;
  preview?: string;
  onFileChange: (type: UploadKey, file: File | null) => void;
  onRemove: (type: UploadKey) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileChange(type, droppedFile);
    }
  };

  return (
    <div className="border border-stone-300 bg-[#f4f4f2] p-4 text-stone-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-stone-900">{label}</h3>
          <p className="mt-1 text-xs text-stone-500">{description}</p>
        </div>

        {file ? (
          <button
            type="button"
            onClick={() => onRemove(type)}
            className="flex h-8 w-8 items-center justify-center border border-stone-300 text-sm text-stone-700 transition hover:bg-stone-200"
            aria-label={`${label} görselini kaldır`}
            title="Görseli kaldır"
          >
            ×
          </button>
        ) : null}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center border border-dashed p-4 text-center transition ${
          isDragging
            ? "border-stone-900 bg-stone-200"
            : "border-stone-300 bg-white"
        }`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onFileChange(type, e.target.files?.[0] || null)}
        />

        {preview ? (
          <div className="w-full">
            <img
              src={preview}
              alt={label}
              className="h-64 w-full object-contain bg-white"
              draggable={false}
            />
            <p className="mt-3 text-xs text-stone-500">
              Değiştirmek için yeni görsel bırakın veya tıklayın
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center border border-stone-300 text-stone-700">
              +
            </div>
            <p className="text-sm text-stone-800">
              Görseli buraya bırakın veya tıklayarak yükleyin
            </p>
            <p className="mt-2 text-xs text-stone-500">PNG, JPG veya WEBP</p>
          </>
        )}
      </label>
    </div>
  );
}

function ResultImageCard({
  src,
  index,
  onOpen,
  onDownload,
}: {
  src: string;
  index: number;
  onOpen: (src: string) => void;
  onDownload: (src: string, index: number) => void;
}) {
  return (
    <div className="group relative overflow-hidden border border-stone-400/40 bg-[#f4f4f2] p-3 text-left">
      <button type="button" onClick={() => onOpen(src)} className="block w-full">
        <div className="relative overflow-hidden bg-white">
          <img
            src={src}
            alt={`fashion-result-${index + 1}`}
            className="h-[520px] w-full object-contain bg-white transition duration-300 group-hover:scale-[1.01]"
            draggable={false}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rotate-[-18deg] select-none text-[36px] font-semibold tracking-[0.25em] text-white/12">
              tuDesign Preview
            </div>
          </div>
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-900">
            Varyasyon {index + 1}
          </p>
          <p className="text-xs text-stone-500">Büyütmek için tıklayın</p>
        </div>

        <button
          type="button"
          onClick={() => onDownload(src, index)}
          className="border border-stone-300 bg-white px-4 py-2 text-xs text-stone-900 transition hover:bg-stone-100"
        >
          İndir
        </button>
      </div>
    </div>
  );
}

function ImageModal({
  src,
  index,
  onClose,
  onDownload,
}: {
  src: string | null;
  index: number | null;
  onClose: () => void;
  onDownload: (src: string, index: number) => void;
}) {
  if (!src || index === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[95vh] w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => onDownload(src, index)}
            className="border border-white/30 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur-sm"
          >
            İndir
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center border border-white/30 bg-black/40 text-xl text-white backdrop-blur-sm"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="relative overflow-hidden border border-white/20 bg-[#111] p-4">
          <img
            src={src}
            alt="Büyük önizleme"
            className="max-h-[85vh] w-full object-contain"
            draggable={false}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rotate-[-18deg] select-none text-[56px] font-semibold tracking-[0.3em] text-white/10">
              tuDesign Preview
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FashionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [country, setCountry] = useState("Türkiye");
  const [customCountry, setCustomCountry] = useState("");
  const [prompt, setPrompt] = useState("");

  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [referenceBoard, setReferenceBoard] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(
    null
  );

  const [selectedTypes, setSelectedTypes] = useState<UploadKey[]>([]);
  const [files, setFiles] = useState<Partial<Record<UploadKey, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<UploadKey, string>>>(
    {}
  );

  const [adminUsers, setAdminUsers] = useState<AdminListUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newClientUsername, setNewClientUsername] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientCredits, setNewClientCredits] = useState("10");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editCredits, setEditCredits] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/fashion/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", disableContextMenu);

    return () => {
      window.removeEventListener("contextmenu", disableContextMenu);
    };
  }, []);

  useEffect(() => {
    const nextPreviews: Partial<Record<UploadKey, string>> = {};
    const objectUrls: string[] = [];

    (Object.keys(files) as UploadKey[]).forEach((key) => {
      const file = files[key];
      if (file) {
        const url = URL.createObjectURL(file);
        nextPreviews[key] = url;
        objectUrls.push(url);
      }
    });

    setPreviews(nextPreviews);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  useEffect(() => {
    if (!selectedResult) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedResult(null);
        setSelectedResultIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedResult]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminUsers();
    }
  }, [user]);

  const uploadedCount = useMemo(() => {
    return Object.values(files).filter(Boolean).length;
  }, [files]);

  const finalCountry = useMemo(() => {
    if (country === "Diğer") return customCountry.trim();
    return country;
  }, [country, customCountry]);

  const canGenerate = useMemo(() => {
    return (
      !!user &&
      uploadedCount > 0 &&
      !!finalCountry &&
      !!prompt.trim() &&
      user.credits > 0
    );
  }, [user, uploadedCount, finalCountry, prompt]);

  const fetchAdminUsers = async () => {
    setAdminLoading(true);
    setAdminError("");

    try {
      const res = await fetch("/api/fashion/admin/list-users");
      const data = await res.json();

      if (!res.ok) {
        setAdminError(data.error || "Kullanıcı listesi alınamadı.");
        return;
      }

      setAdminUsers(data.users || []);
    } catch {
      setAdminError("Kullanıcı listesi alınamadı.");
    } finally {
      setAdminLoading(false);
    }
  };

  const toggleType = (type: UploadKey) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        const next = prev.filter((item) => item !== type);

        setFiles((currentFiles) => {
          const updated = { ...currentFiles };
          delete updated[type];
          return updated;
        });

        return next;
      }

      return [...prev, type];
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/fashion/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Giriş başarısız.");
        return;
      }

      setUser(data.user);
      setUsername("");
      setPassword("");
    } catch {
      setLoginError("Giriş sırasında hata oluştu.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);

    try {
      await fetch("/api/fashion/logout", {
        method: "POST",
      });

      setUser(null);
      setResults([]);
      setReferenceBoard(null);
      setSelectedResult(null);
      setSelectedResultIndex(null);
      setSelectedTypes([]);
      setFiles({});
      setPreviews({});
      setAdminUsers([]);
      setAdminError("");
      setAdminSuccess("");
    } catch {
      //
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleFileChange = (key: UploadKey, file: File | null) => {
    setFiles((prev) => {
      const next = { ...prev };

      if (!file) {
        delete next[key];
      } else {
        next[key] = file;
      }

      return next;
    });
  };

  const handleRemoveFile = (key: UploadKey) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || uploadedCount === 0) return;

    setGenerateLoading(true);
    setGenerateError("");
    setResults([]);
    setReferenceBoard(null);
    setSelectedResult(null);
    setSelectedResultIndex(null);

    try {
      const formData = new FormData();

      selectedTypes.forEach((key) => {
        const file = files[key];
        if (file) {
          formData.append(key, file);
        }
      });

      formData.append("country", finalCountry);
      formData.append("prompt", prompt);

      const res = await fetch("/api/fashion/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error || "Üretim başarısız.");
        return;
      }

      setResults(data.images || []);
      setReferenceBoard(data.referenceBoard || null);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              credits: data.remainingCredits ?? prev.credits,
            }
          : prev
      );
    } catch {
      setGenerateError("Üretim sırasında hata oluştu.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");

    try {
      const res = await fetch("/api/fashion/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: newCompanyName,
          username: newClientUsername,
          password: newClientPassword,
          credits: Number(newClientCredits),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdminError(data.error || "Kullanıcı oluşturulamadı.");
        return;
      }

      setAdminUsers(data.users || []);
      setNewCompanyName("");
      setNewClientUsername("");
      setNewClientPassword("");
      setNewClientCredits("10");
      setAdminSuccess("Yeni kullanıcı oluşturuldu.");
    } catch {
      setAdminError("Kullanıcı oluşturulamadı.");
    }
  };

  const handleUpdateUser = async (
    targetUser: AdminListUser,
    updates: Partial<AdminListUser>
  ) => {
    setAdminError("");
    setAdminSuccess("");

    try {
      const res = await fetch("/api/fashion/admin/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: targetUser.id,
          companyName: updates.companyName ?? targetUser.companyName,
          username: updates.username ?? targetUser.username,
          credits: updates.credits ?? targetUser.credits,
          isActive: updates.isActive ?? targetUser.isActive,
          role: updates.role ?? targetUser.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdminError(data.error || "Kullanıcı güncellenemedi.");
        return;
      }

      setAdminUsers(data.users || []);
      setAdminSuccess("Kullanıcı güncellendi.");
    } catch {
      setAdminError("Kullanıcı güncellenemedi.");
    }
  };

  const startEditUser = (targetUser: AdminListUser) => {
    setEditingUserId(targetUser.id);
    setEditCompanyName(targetUser.companyName);
    setEditUsername(targetUser.username);
    setEditPassword("");
    setEditCredits(String(targetUser.credits));
    setAdminError("");
    setAdminSuccess("");
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditCompanyName("");
    setEditUsername("");
    setEditPassword("");
    setEditCredits("");
  };

  const saveEditUser = async (targetUser: AdminListUser) => {
    setAdminError("");
    setAdminSuccess("");

    try {
      const res = await fetch("/api/fashion/admin/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: targetUser.id,
          companyName: editCompanyName,
          username: editUsername,
          password: editPassword || undefined,
          credits: Number(editCredits),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdminError(data.error || "Kullanıcı güncellenemedi.");
        return;
      }

      setAdminUsers(data.users || []);
      setAdminSuccess("Kullanıcı bilgileri güncellendi.");
      cancelEditUser();
    } catch {
      setAdminError("Kullanıcı güncellenemedi.");
    }
  };

  const openResult = (src: string, index: number) => {
    setSelectedResult(src);
    setSelectedResultIndex(index);
  };

  const handleDownload = (src: string, index: number) => {
    downloadImage(src, `tudesign-fashion-${index + 1}.png`);
  };

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-[#2f2f31] px-6 py-16 text-stone-100">
        <div className="mx-auto max-w-6xl">Yükleniyor...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#2f2f31] px-6 py-16 text-stone-100">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[420px_1fr]">
          <div className="border border-stone-400/40 bg-[#f4f4f2] p-8 text-stone-900">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-stone-500">
              tuDesign Fashion
            </p>
            <h1 className="mb-8 text-3xl text-stone-900">Giriş</h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Kullanıcı adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none"
              />
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none"
              />

              {loginError ? (
                <div className="text-sm text-red-600">{loginError}</div>
              ) : null}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full border border-stone-900 bg-stone-900 px-4 py-3 text-white disabled:opacity-50"
              >
                {loginLoading ? "Giriş yapılıyor..." : "Giriş yap"}
              </button>
            </form>
          </div>

          <div className="border border-stone-400/40 bg-[#f4f4f2] p-8 text-stone-900">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-stone-500">
              Sistem Kullanımı
            </p>
            <h2 className="mb-6 text-3xl text-stone-900">Nasıl Kullanılır?</h2>

            <div className="space-y-5 text-sm leading-7 text-stone-700">
              <div className="border-b border-stone-300 pb-4">
                <p className="font-medium text-stone-900">
                  1. Ürün görsellerinizi yükleyin
                </p>
                <p className="mt-1">
                  Üst giyim, alt giyim, elbise, ayakkabı, çanta veya takı gibi
                  ürünlerinizi ilgili alanlara ekleyin.
                </p>
              </div>

              <div className="border-b border-stone-300 pb-4">
                <p className="font-medium text-stone-900">
                  2. Ülke seçimini yapın
                </p>
                <p className="mt-1">
                  Çekimin geçmesini istediğiniz ülkeyi veya atmosferi seçin.
                </p>
              </div>

              <div className="border-b border-stone-300 pb-4">
                <p className="font-medium text-stone-900">
                  3. Görsel için kısa bir açıklama yazın
                </p>
                <p className="mt-1">
                  Örnek: çölde yürürken, sokakta karşıdan karşıya geçerken,
                  trafikte beklerken, koşarken, yana bakarken, gün batımında
                  ayakta dururken.
                </p>
              </div>

              <div className="border-b border-stone-300 pb-4">
                <p className="font-medium text-stone-900">
                  4. İşlemi başlatın
                </p>
                <p className="mt-1">
                  Tüm verileri girdikten sonra üretimi başlatın. Sistem ortalama
                  1-2 dakika içinde 2 adet görsel oluşturur.
                </p>
              </div>

              <div>
                <p className="font-medium text-stone-900">
                  5. Sonuçları inceleyin
                </p>
                <p className="mt-1">
                  Oluşan görselleri ekranda görüntüleyebilir, büyük önizleme ile
                  detaylı şekilde inceleyebilir ve temiz dosya olarak
                  indirebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#2f2f31] px-6 py-10 text-stone-100">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex flex-col gap-4 border-b border-stone-600 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                tuDesign Fashion
              </p>
              <h1 className="mt-2 text-3xl text-white">{user.companyName}</h1>
              <p className="mt-2 text-sm text-stone-300">
                Rol: <strong>{user.role}</strong> · Kalan kredi:{" "}
                <strong>{user.credits}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="border border-stone-400/40 px-5 py-3 text-sm text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              {logoutLoading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </div>

          {user.role === "admin" ? (
            <div className="mb-10 grid gap-6 xl:grid-cols-[420px_1fr]">
              <div className="border border-stone-400/40 bg-[#f4f4f2] p-5 text-stone-900">
                <h2 className="text-lg font-medium">Yeni Müşteri Aç</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Buradan yeni firma hesabı oluşturabilirsin.
                </p>

                <form onSubmit={handleCreateUser} className="mt-5 space-y-3">
                  <input
                    type="text"
                    placeholder="Firma adı"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full border border-stone-300 bg-white px-4 py-3 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Kullanıcı adı"
                    value={newClientUsername}
                    onChange={(e) => setNewClientUsername(e.target.value)}
                    className="w-full border border-stone-300 bg-white px-4 py-3 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Şifre"
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                    className="w-full border border-stone-300 bg-white px-4 py-3 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Kredi"
                    value={newClientCredits}
                    onChange={(e) => setNewClientCredits(e.target.value)}
                    className="w-full border border-stone-300 bg-white px-4 py-3 outline-none"
                  />

                  {adminError ? (
                    <div className="text-sm text-red-600">{adminError}</div>
                  ) : null}

                  {adminSuccess ? (
                    <div className="text-sm text-green-700">{adminSuccess}</div>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full border border-stone-900 bg-stone-900 px-4 py-3 text-white"
                  >
                    Kullanıcı Oluştur
                  </button>
                </form>
              </div>

              <div className="border border-stone-400/40 bg-[#f4f4f2] p-5 text-stone-900">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium">Kullanıcılar</h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Aktif/pasif, rename, kredi ve üretim sayısı yönetimi
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchAdminUsers}
                    className="border border-stone-300 bg-white px-4 py-2 text-sm"
                  >
                    Yenile
                  </button>
                </div>

                {adminLoading ? (
                  <div className="text-sm text-stone-500">Yükleniyor...</div>
                ) : (
                  <div className="space-y-4">
                    {adminUsers.map((item) => (
                      <div
                        key={item.id}
                        className="border border-stone-300 bg-white p-4"
                      >
                        {editingUserId === item.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editCompanyName}
                              onChange={(e) => setEditCompanyName(e.target.value)}
                              placeholder="Firma adı"
                              className="w-full border border-stone-300 px-3 py-2 outline-none"
                            />

                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              placeholder="Kullanıcı adı"
                              className="w-full border border-stone-300 px-3 py-2 outline-none"
                            />

                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Yeni şifre (boş bırakırsan değişmez)"
                              className="w-full border border-stone-300 px-3 py-2 outline-none"
                            />

                            <input
                              type="number"
                              value={editCredits}
                              onChange={(e) => setEditCredits(e.target.value)}
                              placeholder="Kredi"
                              className="w-full border border-stone-300 px-3 py-2 outline-none"
                            />

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => saveEditUser(item)}
                                className="border border-stone-900 bg-stone-900 px-3 py-2 text-sm text-white"
                              >
                                Kaydet
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditUser}
                                className="border border-stone-300 px-3 py-2 text-sm"
                              >
                                Vazgeç
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-medium text-stone-900">
                                  {item.companyName}
                                </p>
                                <p className="text-sm text-stone-500">
                                  {item.username} · {item.role} ·{" "}
                                  {item.isActive ? "aktif" : "pasif"}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditUser(item)}
                                  className="border border-stone-300 px-3 py-2 text-sm"
                                >
                                  Düzenle
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateUser(item, {
                                      credits: Math.max(0, item.credits + 10),
                                    })
                                  }
                                  className="border border-stone-300 px-3 py-2 text-sm"
                                >
                                  +10 kredi
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateUser(item, {
                                      credits: Math.max(0, item.credits - 10),
                                    })
                                  }
                                  className="border border-stone-300 px-3 py-2 text-sm"
                                >
                                  -10 kredi
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateUser(item, {
                                      isActive: !item.isActive,
                                    })
                                  }
                                  className="border border-stone-300 px-3 py-2 text-sm"
                                >
                                  {item.isActive ? "Pasif yap" : "Aktif yap"}
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm text-stone-600 md:grid-cols-2">
                              <div>
                                Kredi: <strong>{item.credits}</strong>
                              </div>
                              <div>
                                Üretim adedi:{" "}
                                <strong>{item.generatedCount}</strong>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="grid gap-10 xl:grid-cols-[620px_1fr]">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="border border-stone-400/40 bg-[#f4f4f2] p-5 text-stone-900">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-stone-900">
                    Parça Seçimi
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Önce eklemek istediğiniz ürün kategorilerini seçin.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {(Object.keys(uploadLabels) as UploadKey[]).map((key) => {
                    const active = selectedTypes.includes(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleType(key)}
                        className={`border px-4 py-4 text-left transition ${
                          active
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-300 bg-white text-stone-900 hover:bg-stone-100"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {uploadLabels[key]}
                        </div>
                        <div
                          className={`mt-1 text-xs ${
                            active ? "text-stone-300" : "text-stone-500"
                          }`}
                        >
                          {uploadDescriptions[key]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedTypes.length > 0 ? (
                <div className="border border-stone-400/40 bg-[#f4f4f2] p-5 text-stone-900">
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-stone-900">
                      Yükleme Alanı
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Seçtiğiniz kategoriler için görsel ekleyin. Tutup bırak
                      aktif.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedTypes.map((key) => (
                      <UploadCard
                        key={key}
                        type={key}
                        label={uploadLabels[key]}
                        description={uploadDescriptions[key]}
                        file={files[key]}
                        preview={previews[key]}
                        onFileChange={handleFileChange}
                        onRemove={handleRemoveFile}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border border-stone-400/40 bg-[#f4f4f2] p-5 text-stone-900">
                <label className="mb-2 block text-sm text-stone-900">
                  Ülke
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none"
                >
                  {countries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {country === "Diğer" ? (
                  <input
                    type="text"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder="Ülke / şehir girin"
                    className="mt-3 w-full border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none"
                  />
                ) : null}
              </div>

              <div className="border border-stone-400/40 bg-[#f4f4f2] p-5 text-stone-900">
                <label className="mb-2 block text-sm text-stone-900">
                  Sahne promptu
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="ör. çölde yürürken, gün batımında ayakta dururken, şehirde karşıya geçerken"
                  rows={5}
                  className="w-full border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none"
                />
              </div>

              <div className="text-sm text-stone-300">
                Yüklenen parça sayısı: <strong>{uploadedCount}</strong>
              </div>

              {generateError ? (
                <div className="text-sm text-red-400">{generateError}</div>
              ) : null}

              <button
                type="submit"
                disabled={!canGenerate || generateLoading}
                className="w-full border border-stone-900 bg-stone-900 px-4 py-4 text-white disabled:opacity-50"
              >
                {generateLoading ? "Üretiliyor..." : "2 Varyasyon Oluştur"}
              </button>
            </form>

            <section>
              <div className="mb-4">
                <h2 className="text-2xl text-white">Sonuçlar</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Sonuç görsellerine tıklayarak büyük önizleme açabilirsiniz.
                </p>
              </div>

              {referenceBoard ? (
                <div className="mb-6 border border-stone-400/40 bg-[#f4f4f2] p-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-stone-900">
                      AI Referans Board
                    </p>
                    <p className="text-xs text-stone-500">
                      AI’ın kullandığı ürün referans kolajı
                    </p>
                  </div>

                  <div className="overflow-hidden border border-stone-300 bg-white p-3">
                    <img
                      src={referenceBoard}
                      alt="Reference Board"
                      className="h-auto w-full object-contain bg-white"
                      draggable={false}
                    />
                  </div>
                </div>
              ) : null}

              {results.length === 0 ? (
                <div className="border border-dashed border-stone-500 bg-[#f4f4f2] p-16 text-sm text-stone-500">
                  Henüz sonuç yok.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {results.map((src, index) => (
                    <ResultImageCard
                      key={src + index}
                      src={src}
                      index={index}
                      onOpen={(clickedSrc) => openResult(clickedSrc, index)}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <ImageModal
        src={selectedResult}
        index={selectedResultIndex}
        onClose={() => {
          setSelectedResult(null);
          setSelectedResultIndex(null);
        }}
        onDownload={handleDownload}
      />
    </>
  );
}