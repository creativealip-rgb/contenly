import React, { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Play,
  Square,
  Copy,
  Check,
  Loader2,
  FileText,
  Clock,
  Video,
  Volume2,
  AlertCircle,
  Download,
  ListVideo,
  FolderDown,
  Search,
  ImagePlus,
  ImageIcon,
  Code,
  RefreshCw,
  History,
  Trash2,
  Mic,
  Edit3,
} from "lucide-react";

// --- CONFIGURATION & API ---
const apiKey = ""; // Diisi otomatis oleh sistem pada environment eksekusi
const TEXT_MODEL = "gemini-2.5-flash-preview-09-2025";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const IMAGE_MODEL = "imagen-4.0-generate-001";

export default function App() {
  const [article, setArticle] = useState("");
  const [duration, setDuration] = useState("30 detik");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptData, setScriptData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isDownloadingAllVO, setIsDownloadingAllVO] = useState(false);
  const [voice, setVoice] = useState("Zephyr");

  // --- NEW STATES FOR REGENERATE & HISTORY ---
  const [regeneratingState, setRegeneratingState] = useState({
    headline: false,
    sub_headline: false,
    caption: false,
    thumbnail_prompt: false,
  });
  const [regeneratingSceneVO, setRegeneratingSceneVO] = useState({});

  // Menggunakan Lazy Initialization agar Local Storage langsung dibaca saat komponen pertama kali dirender
  // Ini mencegah bug tertimpanya data oleh array kosong [] saat di-refresh
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem("scriptCreatorHistory");
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory);
      } catch (e) {
        console.error("Gagal memuat riwayat", e);
        return [];
      }
    }
    return [];
  });

  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  // Save History to Local Storage whenever it changes
  useEffect(() => {
    localStorage.setItem("scriptCreatorHistory", JSON.stringify(history));
  }, [history]);

  // Audio & Image State Management
  const [audioStates, setAudioStates] = useState({}); // { sceneIndex: { isLoading: true/false, isPlaying: true/false, url: blobUrl } }
  const [thumbnailState, setThumbnailState] = useState({
    isLoading: false,
    url: null,
    error: null,
    promptText: "",
  });
  const audioRefs = useRef({});

  // --- API CALLS WITH RETRY ---
  const fetchWithRetry = async (url, options, retries = 3) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || `HTTP error! status: ${response.status}`,
          );
        }
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
  };

  // --- SCRIPT GENERATION ---
  const handleGenerateScript = async () => {
    if (!article.trim()) {
      setError("Silakan masukkan artikel terlebih dahulu.");
      return;
    }

    setIsGeneratingScript(true);
    setError("");
    setScriptData(null);
    setAudioStates({});
    setCurrentHistoryId(null);
    setThumbnailState({
      isLoading: false,
      url: null,
      error: null,
      promptText: "",
    });

    // Stop any playing audio
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Menentukan panduan jumlah karakter berdasarkan durasi (1000 karakter = 60 detik)
    let totalSeconds = 30; // Default
    const durationStr = duration.toLowerCase();
    const numMatch = durationStr.match(/[\d.]+/);

    if (numMatch) {
      const num = parseFloat(numMatch[0]);
      if (durationStr.includes("menit") || durationStr.includes("minute")) {
        totalSeconds = num * 60;
      } else {
        totalSeconds = num; // Asumsi detik
      }
    }

    // Menghitung target kata (patokan: 160 kata = 60 detik)
    const targetWords = Math.round(totalSeconds * (160 / 60));
    const maxWords = Math.round(targetWords * 1.15); // Toleransi batas atas 15%

    const wordCountGuideline = `ATURAN DURASI SANGAT KETAT: Total keseluruhan teks 'audio' (Voice Over) dari SEMUA scene jika digabungkan HARUS BERKISAR DI ANGKA ${targetWords} KATA (Maksimal absolut: ${maxWords} kata). JANGAN LEBIH DARI INI. Jika artikel aslinya panjang, kamu WAJIB MERINGKASNYA dan hanya mengambil intisarinya saja agar durasi video benar-benar pas ${duration}.`;

    const systemInstruction = `Kamu adalah seorang Scriptwriter profesional untuk TikTok, Instagram Reels, dan YouTube Shorts.
    Tugasmu adalah mengubah artikel menjadi script video pendek yang sangat engaging, viral, dan terstruktur.
    ${wordCountGuideline}
    Pecah naskah menjadi beberapa scene singkat agar pacingnya cepat dan dinamis khas video pendek.
    Gunakan gaya bahasa santai, natural, dan hook yang memancing rasa penasaran di 3 detik pertama.

    TAMBAHAN: Buatkan juga Headline yang bombastis (maksimal 40 karakter), Sub-headline (maksimal 70 karakter), dan Caption media sosial yang siap pakai (lengkap dengan hashtag).

    ATURAN FOOTAGE: Berikan 3 hingga 5 referensi pencarian (Search Query) untuk SETIAP scene. Variasikan platformnya (YouTube, TikTok, Pexels, X, dll) agar pengguna punya banyak pilihan yang sesuai.

    ATURAN THUMBNAIL PROMPT: Buat 1 buah 'thumbnail_prompt' berbahasa INGGRIS yang SANGAT MENDETAIL (minimal 40 kata) untuk gambar cover/thumbnail video. Deskripsikan secara rinci: Subjek, aksi, ekspresi wajah, setting lokasi, pencahayaan (cinematic, dramatic, dll), warna dominan, dan kualitas visual berdasarkan keseluruhan isi artikel.

    Output HARUS berupa JSON murni tanpa markdown formatter (tanpa \`\`\`json) dengan skema:
    {
      "title": "Judul Ide Konten",
      "headline": "Headline bombastis maksimal 40 karakter",
      "sub_headline": "Sub-headline maksimal 70 karakter",
      "caption": "Caption media sosial yang menarik beserta hashtag",
      "hook": "Kalimat pertama yang sangat menarik perhatian",
      "thumbnail_prompt": "Prompt teks bahasa INGGRIS yang SANGAT MENDETAIL untuk thumbnail video...",
      "scenes": [
        {
          "visual": "Deskripsi visual/footage/B-roll secara detail untuk diedit editor",
          "audio": "Teks Voice Over (VO) yang akan diucapkan.",
          "footage_searches": [
            { "platform": "YouTube", "keyword": "...", "url": "https://www.youtube.com/results?search_query=..." },
            { "platform": "Pexels", "keyword": "...", "url": "https://www.pexels.com/search/..." },
            { "platform": "TikTok", "keyword": "...", "url": "https://www.tiktok.com/search?q=..." }
          ]
        }
      ]
    }`;

    try {
      const payload = {
        contents: [{ parts: [{ text: `Artikel:\n${article}` }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
        },
      };

      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error("Gagal mendapatkan respons dari AI.");

      const parsedData = JSON.parse(responseText);
      setScriptData(parsedData);
      setThumbnailState((prev) => ({
        ...prev,
        promptText: parsedData.thumbnail_prompt || "",
      }));

      // Save to History
      const newId = Date.now().toString();
      const newHistoryItem = {
        id: newId,
        date: new Date().toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        article: article,
        duration: duration,
        scriptData: parsedData,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
      setCurrentHistoryId(newId);
    } catch (err) {
      console.error(err);
      setError(`Terjadi kesalahan saat membuat script: ${err.message}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // --- AUDIO GENERATION (TTS) ---
  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const createWavFile = (pcmDataBuffer, sampleRate) => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmDataBuffer.byteLength;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (v, offset, string) => {
      for (let i = 0; i < string.length; i++)
        v.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    const pcmData = new Uint8Array(pcmDataBuffer);
    const wavData = new Uint8Array(buffer, 44, dataSize);
    wavData.set(pcmData);

    return new Blob([view], { type: "audio/wav" });
  };

  const extractSampleRate = (mimeType) => {
    const match = mimeType.match(/rate=(\d+)/);
    return match ? parseInt(match[1], 10) : 24000;
  };

  const getAudioPcmData = async (text) => {
    const payload = {
      contents: [{ parts: [{ text: text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
      model: TTS_MODEL,
    };

    const data = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData) throw new Error("Gagal menghasilkan audio dari AI.");

    const sampleRate = extractSampleRate(inlineData.mimeType);
    const pcmBuffer = base64ToArrayBuffer(inlineData.data);
    return { pcmBuffer, sampleRate };
  };

  const generateAndGetAudioUrl = async (text) => {
    const { pcmBuffer, sampleRate } = await getAudioPcmData(text);
    const wavBlob = createWavFile(pcmBuffer, sampleRate);
    return URL.createObjectURL(wavBlob);
  };

  const handlePlayAudio = async (text, sceneIndex) => {
    const currentState = audioStates[sceneIndex] || {};

    if (currentState.isPlaying) {
      if (audioRefs.current[sceneIndex]) {
        audioRefs.current[sceneIndex].pause();
      }
      setAudioStates((prev) => ({
        ...prev,
        [sceneIndex]: { ...prev[sceneIndex], isPlaying: false },
      }));
      return;
    }

    if (currentState.url) {
      const audio = audioRefs.current[sceneIndex];
      if (audio) {
        audio.play();
        setAudioStates((prev) => ({
          ...prev,
          [sceneIndex]: { ...prev[sceneIndex], isPlaying: true },
        }));
      }
      return;
    }

    setAudioStates((prev) => ({
      ...prev,
      [sceneIndex]: { isLoading: true, isPlaying: false, url: null },
    }));

    try {
      const audioUrl = await generateAndGetAudioUrl(text);
      const audioObj = new Audio(audioUrl);

      audioObj.onended = () => {
        setAudioStates((prev) => ({
          ...prev,
          [sceneIndex]: { ...prev[sceneIndex], isPlaying: false },
        }));
      };

      audioRefs.current[sceneIndex] = audioObj;
      audioObj.play();

      setAudioStates((prev) => ({
        ...prev,
        [sceneIndex]: { isLoading: false, isPlaying: true, url: audioUrl },
      }));
    } catch (err) {
      console.error(err);
      alert("Gagal menghasilkan audio: " + err.message);
      setAudioStates((prev) => ({
        ...prev,
        [sceneIndex]: { isLoading: false, isPlaying: false, url: null },
      }));
    }
  };

  const handleDownloadAllVO = async () => {
    if (!scriptData) return;
    setIsDownloadingAllVO(true);
    try {
      let allPcmData = [];
      let commonSampleRate = 24000;
      let totalLength = 0;

      // Menggenerate audio PER SCENE lalu menjahitnya agar intonasi 100% sama dengan preview
      for (let i = 0; i < scriptData.scenes.length; i++) {
        const text = scriptData.scenes[i].audio;
        const { pcmBuffer, sampleRate } = await getAudioPcmData(text);
        commonSampleRate = sampleRate;

        const pcmArray = new Uint8Array(pcmBuffer);
        allPcmData.push(pcmArray);
        totalLength += pcmArray.length;

        // Tambahkan jeda diam (silence) 0.5 detik antar scene agar terdengar natural
        if (i < scriptData.scenes.length - 1) {
          // 16-bit PCM = 2 bytes per sample. 1 channel
          const silenceLength = sampleRate * 2 * 0.5;
          const silence = new Uint8Array(silenceLength); // otomatis berisi 0 (silence)
          allPcmData.push(silence);
          totalLength += silenceLength;
        }
      }

      // Gabungkan seluruh data buffer PCM
      const combinedPcm = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of allPcmData) {
        combinedPcm.set(arr, offset);
        offset += arr.length;
      }

      // Buat 1 file WAV utuh
      const wavBlob = createWavFile(combinedPcm.buffer, commonSampleRate);
      const url = URL.createObjectURL(wavBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${scriptData.title.replace(/[^a-z0-9]/gi, "_").substring(0, 20)}_Full_VO.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunduh Full VO: " + err.message);
    } finally {
      setIsDownloadingAllVO(false);
    }
  };

  // --- REGENERATE SPECIFIC FIELD ---
  const handleRegenerateField = async (field) => {
    if (!article || !scriptData) return;
    setRegeneratingState((prev) => ({ ...prev, [field]: true }));
    try {
      const fieldNames = {
        headline: "Headline bombastis maksimal 40 karakter",
        sub_headline: "Sub-headline maksimal 70 karakter",
        caption: "Caption media sosial yang menarik beserta hashtag",
        thumbnail_prompt:
          "Prompt teks bahasa INGGRIS yang SANGAT MENDETAIL untuk thumbnail video",
      };

      const prompt = `Kamu adalah Scriptwriter profesional. Berdasarkan artikel di bawah, buatkan 1 ${fieldNames[field]} BARU yang berbeda dari sebelumnya.

      Artikel Asli:
      ${article}

      Versi Sebelumnya:
      ${scriptData[field]}

      Output HARUS berupa JSON murni tanpa markdown formatter (tanpa \`\`\`json) dengan skema:
      {
        "${field}": "hasil baru di sini"
      }`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      };

      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedData = JSON.parse(responseText);

      const newData = { ...scriptData, [field]: parsedData[field] };
      setScriptData(newData);

      if (field === "thumbnail_prompt") {
        setThumbnailState((prev) => ({
          ...prev,
          promptText: parsedData[field],
        }));
      }

      // Update current history item automatically
      if (currentHistoryId) {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === currentHistoryId
              ? { ...item, scriptData: newData }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      alert(`Gagal membuat ulang: ${err.message}`);
    } finally {
      setRegeneratingState((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleRegenerateSceneVO = async (index) => {
    if (!article || !scriptData) return;
    setRegeneratingSceneVO((prev) => ({ ...prev, [index]: true }));
    try {
      const currentScene = scriptData.scenes[index];
      const prompt = `Kamu adalah Scriptwriter profesional. Berdasarkan artikel dan instruksi visual di bawah, buatkan alternatif teks Voice Over (VO) BARU yang berbeda dari sebelumnya khusus untuk Scene ini saja. Buat senatural mungkin dan to the point.

      Artikel Asli:
      ${article}

      Instruksi Visual Scene ini:
      ${currentScene.visual}

      Teks VO Sebelumnya:
      ${currentScene.audio}

      Output HARUS berupa JSON murni tanpa markdown formatter (tanpa \`\`\`json) dengan skema:
      {
        "audio": "teks voice over alternatif yang baru"
      }`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      };

      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedData = JSON.parse(responseText);

      const newData = { ...scriptData };
      newData.scenes[index].audio = parsedData.audio;
      setScriptData(newData);

      // Clear audio cache for this scene since text changed
      setAudioStates((prev) => ({
        ...prev,
        [index]: { isLoading: false, isPlaying: false, url: null },
      }));
      if (audioRefs.current[index]) {
        audioRefs.current[index].pause();
        audioRefs.current[index] = null;
      }

      // Update current history item automatically
      if (currentHistoryId) {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === currentHistoryId
              ? { ...item, scriptData: newData }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      alert(`Gagal membuat ulang VO: ${err.message}`);
    } finally {
      setRegeneratingSceneVO((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleGenerateThumbnail = async () => {
    setThumbnailState((prev) => ({
      ...prev,
      isLoading: true,
      url: null,
      error: null,
    }));
    try {
      // Mengubah parameter kembali menjadi kompatibel dengan standard API proxy.
      // Aspect ratio "9:16" disisipkan langsung ke dalam teks instruksi prompt agar terhindar dari Error 401 Unathorized
      // yang terjadi akibat ketidakcocokan parameter di sistem proxy.
      const modifiedPrompt =
        thumbnailState.promptText +
        ", high quality, vertical 9:16 aspect ratio layout";

      const payload = {
        instances: { prompt: modifiedPrompt },
        parameters: { sampleCount: 1 },
      };

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      let base64Image = "";
      if (response.predictions && response.predictions.length > 0) {
        const pred = response.predictions[0];
        base64Image =
          pred.bytesBase64Encoded ||
          (typeof pred === "string" ? pred : pred.image?.bytesBase64Encoded);
      } else if (response.bytesBase64Encoded) {
        base64Image = response.bytesBase64Encoded;
      }

      if (!base64Image) {
        throw new Error(
          "Gagal mengambil gambar. Pastikan prompt mematuhi kebijakan safety.",
        );
      }

      const imageUrl = `data:image/png;base64,${base64Image}`;
      setThumbnailState((prev) => ({
        ...prev,
        isLoading: false,
        url: imageUrl,
        error: null,
      }));
    } catch (err) {
      console.error("Image generation error:", err);
      const isUnauthorized = err.message.includes("401");
      const errorMessage = isUnauthorized
        ? "Error 401: API Key tidak valid / Format Parameter Ditolak. Sistem kembali menggunakan format prompt default."
        : err.message;
      setThumbnailState((prev) => ({
        ...prev,
        isLoading: false,
        url: null,
        error: errorMessage,
      }));
    }
  };

  // --- UTILS ---
  const copyToClipboard = () => {
    if (!scriptData) return;

    let formattedText = `[TITLE]: ${scriptData.title}\n`;
    formattedText += `[HEADLINE]: ${scriptData.headline}\n`;
    formattedText += `[SUB-HEADLINE]: ${scriptData.sub_headline}\n`;
    formattedText += `[HOOK]: ${scriptData.hook}\n\n`;
    formattedText += `[THUMBNAIL PROMPT]:\n${scriptData.thumbnail_prompt}\n\n`;
    formattedText += `[CAPTION]:\n${scriptData.caption}\n\n`;

    scriptData.scenes.forEach((scene, i) => {
      formattedText += `--- Scene ${i + 1} ---\n`;
      formattedText += `🎥 VISUAL: ${scene.visual}\n`;
      if (scene.footage_searches && scene.footage_searches.length > 0) {
        formattedText += `🔍 REFERENSI FOOTAGE:\n`;
        scene.footage_searches.forEach((search) => {
          formattedText += `   - ${search.platform}: ${search.url}\n`;
        });
      }
      formattedText += `🗣️ AUDIO: ${scene.audio}\n\n`;
    });

    const textarea = document.createElement("textarea");
    textarea.value = formattedText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textarea);
  };

  const handleDownloadScript = () => {
    if (!scriptData) return;

    // Format naskah bersih: Hanya memuat teks VO untuk dibaca
    let formattedText = `JUDUL: ${scriptData.title}\n\n`;

    scriptData.scenes.forEach((scene) => {
      formattedText += `${scene.audio}\n\n`;
    });

    const blob = new Blob([formattedText.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_clean_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!scriptData) return;
    const blob = new Blob([JSON.stringify(scriptData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_prompts.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyCaptionOnly = () => {
    if (!scriptData?.caption) return;
    const textarea = document.createElement("textarea");
    textarea.value = scriptData.caption;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textarea);
  };

  // --- HISTORY HANDLERS ---
  const loadHistoryItem = (item) => {
    setArticle(item.article);
    setDuration(item.duration);
    setScriptData(item.scriptData);
    setThumbnailState({
      isLoading: false,
      url: null,
      error: null,
      promptText: item.scriptData.thumbnail_prompt || "",
    });
    setCurrentHistoryId(item.id);
    setAudioStates({});
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentHistoryId === id) {
      setScriptData(null);
      setCurrentHistoryId(null);
      setArticle("");
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
            <ListVideo className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
            AI Script & Audio Creator
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Ubah artikel atau tulisan panjang menjadi naskah siap rekam untuk
            TikTok/Reels, lengkap dengan rekomendasi B-roll dan Voice Over AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">Input Artikel</h2>
              </div>

              <textarea
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                placeholder="Tempelkan (paste) artikel, blog, atau ide tulisan Anda di sini..."
                className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none mb-6"
              />

              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">Target Durasi Konten</h2>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <div className="grid grid-cols-3 gap-3">
                  {["15 detik", "30 detik", "60 detik"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDuration(opt)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                        duration === opt
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500"
                          : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Atau ketik custom (cth: 2 Menit)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold">
                  Pilih Karakter Suara VO
                </h2>
              </div>

              <select
                value={voice}
                onChange={(e) => {
                  setVoice(e.target.value);
                  // Hapus cache audio lama agar menggunakan suara baru saat diputar
                  setAudioStates({});
                  Object.values(audioRefs.current).forEach(
                    (audio) => audio && audio.pause(),
                  );
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-8 cursor-pointer appearance-none"
              >
                {[
                  "Zephyr",
                  "Puck",
                  "Charon",
                  "Kore",
                  "Fenrir",
                  "Leda",
                  "Orus",
                  "Aoede",
                  "Callirrhoe",
                ].map((v) => (
                  <option key={v} value={v}>
                    Karakter Suara AI: {v}
                  </option>
                ))}
              </select>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 focus:ring-4 focus:ring-white/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGeneratingScript ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyusun Naskah AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Script
                  </>
                )}
              </button>
            </div>

            {/* Riwayat Generate */}
            {history.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold">Riwayat Naskah</h2>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className={`p-4 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                        currentHistoryId === item.id
                          ? "bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="overflow-hidden pr-3">
                        <p className="text-sm font-bold text-white truncate">
                          {item.scriptData.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {item.date} • {item.duration}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                        title="Hapus Riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            {!scriptData && !isGeneratingScript && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-900/50 border border-neutral-800 border-dashed rounded-3xl min-h-[400px]">
                <Video className="w-16 h-16 text-neutral-700 mb-4" />
                <h3 className="text-xl font-semibold text-neutral-400 mb-2">
                  Belum ada naskah
                </h3>
                <p className="text-neutral-500 text-sm max-w-sm">
                  Masukkan artikel di kolom sebelah kiri dan tekan "Generate
                  Script" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}

            {isGeneratingScript && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-900 border border-neutral-800 rounded-3xl min-h-[400px]">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                  <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-lg font-medium text-neutral-200">
                  AI sedang membedah artikel...
                </h3>
                <p className="text-neutral-500 text-sm mt-2">
                  Menganalisis hook, membagi adegan, dan menulis teks VO.
                </p>
              </div>
            )}

            {scriptData && !isGeneratingScript && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                {/* Script Header (Non-Sticky, flows naturally) */}
                <div className="p-6 bg-neutral-900 border-b border-neutral-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                        {scriptData.title}
                      </h2>
                      <div className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium border border-green-500/20">
                        Target: {duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleDownloadAllVO}
                        disabled={isDownloadingAllVO}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/20 text-sm font-medium"
                        title="Download Full VO (1 File)"
                      >
                        {isDownloadingAllVO ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FolderDown className="w-4 h-4" />
                        )}
                        <span className="hidden lg:inline">Full VO</span>
                      </button>
                      <button
                        onClick={handleDownloadScript}
                        className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors border border-neutral-700 hover:border-neutral-600 flex items-center justify-center"
                        title="Download Naskah Text (Clean)"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleDownloadJSON}
                        className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors border border-neutral-700 hover:border-neutral-600 flex items-center justify-center"
                        title="Download Prompt JSON"
                      >
                        <Code className="w-5 h-5" />
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors border border-neutral-700 hover:border-neutral-600 flex items-center justify-center"
                        title="Copy full script"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl relative">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                          💥 Headline (Max 40 Char)
                        </p>
                        <button
                          onClick={() => handleRegenerateField("headline")}
                          disabled={regeneratingState.headline}
                          className="p-1.5 text-orange-400 hover:bg-orange-500/20 rounded-md transition-colors"
                          title="Generate Ulang Headline"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${regeneratingState.headline ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                      <h3 className="text-lg text-white font-bold leading-tight">
                        {scriptData.headline}
                      </h3>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl relative">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                          ✨ Sub-Headline (Max 70 Char)
                        </p>
                        <button
                          onClick={() => handleRegenerateField("sub_headline")}
                          disabled={regeneratingState.sub_headline}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
                          title="Generate Ulang Sub-Headline"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${regeneratingState.sub_headline ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                      <p className="text-sm text-neutral-200 font-medium leading-snug">
                        {scriptData.sub_headline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl relative group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-pink-400 font-bold uppercase tracking-wider">
                        📝 Caption Sosmed
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRegenerateField("caption")}
                          disabled={regeneratingState.caption}
                          className="text-pink-400 hover:text-pink-300 p-1.5 hover:bg-pink-500/20 rounded-md transition-colors"
                          title="Generate Ulang Caption"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${regeneratingState.caption ? "animate-spin" : ""}`}
                          />
                        </button>
                        <button
                          onClick={copyCaptionOnly}
                          className="text-pink-400 hover:text-pink-300 p-1.5 bg-pink-500/20 rounded-md transition-colors ml-1"
                          title="Copy Caption"
                        >
                          {copiedCaption ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-200 whitespace-pre-wrap">
                      {scriptData.caption}
                    </p>
                  </div>

                  <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">
                      🔥 Main Hook
                    </p>
                    <p className="text-neutral-200 text-sm font-medium leading-relaxed">
                      "{scriptData.hook}"
                    </p>
                  </div>

                  {/* Thumbnail Generator Section */}
                  <div className="mt-6 p-6 border border-neutral-800 bg-neutral-950 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-white">
                          AI Thumbnail Generator
                        </h3>
                      </div>
                      <button
                        onClick={() =>
                          handleRegenerateField("thumbnail_prompt")
                        }
                        disabled={regeneratingState.thumbnail_prompt}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-colors"
                        title="Buat ulang Prompt via AI"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${regeneratingState.thumbnail_prompt ? "animate-spin" : ""}`}
                        />
                        AI Re-Prompt
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">
                      Satu prompt detail untuk menghasilkan gambar
                      sampul/thumbnail video ini secara utuh.
                    </p>
                    <textarea
                      value={thumbnailState.promptText}
                      onChange={(e) =>
                        setThumbnailState((prev) => ({
                          ...prev,
                          promptText: e.target.value,
                        }))
                      }
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 mb-4 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                      rows="3"
                      placeholder="Prompt untuk AI Thumbnail (Bahasa Inggris)"
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <button
                        onClick={handleGenerateThumbnail}
                        disabled={
                          !thumbnailState.promptText || thumbnailState.isLoading
                        }
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        {thumbnailState.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                        Generate Thumbnail
                      </button>
                      {thumbnailState.error && (
                        <span className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                          {thumbnailState.error}
                        </span>
                      )}
                    </div>

                    {thumbnailState.url && (
                      <div className="mt-6 relative group rounded-2xl overflow-hidden border border-neutral-700 inline-block w-full text-center">
                        <img
                          src={thumbnailState.url}
                          alt="Thumbnail"
                          className="w-full h-auto max-h-[600px] object-contain bg-black rounded-xl"
                        />
                        <a
                          href={thumbnailState.url}
                          download={`${scriptData.title.substring(0, 15)}_thumbnail.png`}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-xl"
                        >
                          <div className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-colors">
                            <Download className="w-5 h-5" /> Download Thumbnail
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Script Scenes (Not internally scrollable, scrolls with page) */}
                <div className="p-6 space-y-6">
                  {scriptData.scenes.map((scene, index) => {
                    const sceneAudioState = audioStates[index] || {};
                    return (
                      <div
                        key={index}
                        className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-md"
                      >
                        {/* Scene Header */}
                        <div className="bg-neutral-800/50 px-4 py-2 border-b border-neutral-800 flex justify-between items-center">
                          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            Scene {index + 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
                          {/* Visual Section */}
                          <div className="p-5 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                              <Video className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-semibold text-neutral-300">
                                Visual & Footage
                              </span>
                            </div>
                            <p className="text-sm text-neutral-400 leading-relaxed italic mb-4">
                              {scene.visual}
                            </p>

                            {scene.footage_searches &&
                              scene.footage_searches.length > 0 && (
                                <div className="mt-auto pt-4 border-t border-neutral-800/50">
                                  <span className="text-xs text-neutral-500 font-medium mb-2 block">
                                    Cari Footage Referensi:
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {scene.footage_searches.map(
                                      (search, idx) => (
                                        <a
                                          key={idx}
                                          href={search.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors border border-neutral-700 hover:border-neutral-500"
                                          title={`Cari di ${search.platform}`}
                                        >
                                          <Search className="w-3 h-3" />
                                          <span className="font-medium">
                                            {search.platform}:
                                          </span>{" "}
                                          {search.keyword}
                                        </a>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Audio Section */}
                          <div className="p-5 flex flex-col bg-indigo-500/5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-semibold text-neutral-300">
                                  Voice Over
                                </span>
                              </div>

                              {/* Audio Controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRegenerateSceneVO(index)}
                                  disabled={regeneratingSceneVO[index]}
                                  className="p-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded-md transition-colors"
                                  title="Generate Ulang VO Scene Ini"
                                >
                                  <RefreshCw
                                    className={`w-4 h-4 ${regeneratingSceneVO[index] ? "animate-spin" : ""}`}
                                  />
                                </button>
                                {sceneAudioState.url && (
                                  <a
                                    href={sceneAudioState.url}
                                    download={`scene_${index + 1}.wav`}
                                    className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                                    title="Download Audio Scene"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() =>
                                    handlePlayAudio(scene.audio, index)
                                  }
                                  disabled={sceneAudioState.isLoading}
                                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                                    sceneAudioState.isPlaying
                                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                      : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
                                  }`}
                                  title={
                                    sceneAudioState.isPlaying
                                      ? "Stop VO"
                                      : "Generate & Play VO"
                                  }
                                >
                                  {sceneAudioState.isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : sceneAudioState.isPlaying ? (
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="relative group">
                              <textarea
                                value={scene.audio}
                                onChange={(e) => {
                                  const newData = { ...scriptData };
                                  newData.scenes[index].audio = e.target.value;
                                  setScriptData(newData);

                                  // Clear audio cache on manual edit
                                  setAudioStates((prev) => ({
                                    ...prev,
                                    [index]: {
                                      isLoading: false,
                                      isPlaying: false,
                                      url: null,
                                    },
                                  }));
                                  if (audioRefs.current[index]) {
                                    audioRefs.current[index].pause();
                                    audioRefs.current[index] = null;
                                  }
                                }}
                                onBlur={() => {
                                  if (currentHistoryId) {
                                    setHistory((prev) =>
                                      prev.map((item) =>
                                        item.id === currentHistoryId
                                          ? { ...item, scriptData: scriptData }
                                          : item,
                                      ),
                                    );
                                  }
                                }}
                                className="w-full bg-black/20 border border-indigo-500/10 hover:border-indigo-500/30 focus:border-indigo-500/50 rounded-lg p-3 text-sm text-white font-medium leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y min-h-[100px] transition-colors"
                                placeholder="Teks Voice Over..."
                              />
                              <Edit3 className="w-4 h-4 text-neutral-500 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
