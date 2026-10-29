import type { EffectId } from "@/components/processor/effects";

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolFeature {
  title: string;
  body: string;
  icon: string;
}

export interface Tool {
  /** Route path, "/" for the home cutter */
  path: string;
  /** Set for tools served by the shared AudioProcessor via app/[tool] */
  effect?: EffectId;
  name: string;
  /** One-liner for tool cards and nav */
  tagline: string;
  /** Page <title>; the home page uses it verbatim, others get the site template */
  metaTitle: string;
  description: string;
  keywords: string[];
  badge: string;
  heading: { before: string; highlight: string };
  intro: string;
  icon: string;
  features: ToolFeature[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  faqs: ToolFaq[];
}

// Heroicons (outline) path data
export const icons = {
  scissors:
    "m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664",
  phone:
    "M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
  link:
    "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244",
  lock:
    "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
  sparkles:
    "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  bolt: "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  bars:
    "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  convert: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  video:
    "m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z",
  speaker:
    "M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z",
  forward:
    "M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z",
  note:
    "m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z",
  mute:
    "M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z",
  trend: "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
  uturn: "M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3",
  plus: "M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  mic: "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
  wand:
    "M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42",
  bell:
    "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
};

const privacyFeature: ToolFeature = {
  title: "Private by design",
  body: "Decoding, editing and encoding all run in your browser tab. Nothing is uploaded.",
  icon: icons.lock,
};

const freeFeature: ToolFeature = {
  title: "Instant & free",
  body: "No signup, no watermark, no waiting in a queue. Drop a file and go.",
  icon: icons.bolt,
};

const formatsFaq: ToolFaq = {
  question: "Which audio formats are supported?",
  answer:
    "You can open MP3, WAV, OGG, M4A, AAC and FLAC files (anything your browser can decode), and export the result as MP3 (128–320 kbps) or lossless WAV.",
};

const privacyFaq: ToolFaq = {
  question: "Are my audio files uploaded to a server?",
  answer:
    "No. Your files are decoded, edited and encoded entirely inside your browser using the Web Audio API. They never leave your device.",
};

export const mp3Cutter: Tool = {
  path: "/",
  name: "MP3 Cutter",
  tagline: "Trim any audio file to the exact part you need.",
  metaTitle: "SnipAudio — Free Online MP3 Cutter & Audio Trimmer (No Upload)",
  description:
    "Cut, trim, and export MP3, WAV, OGG, M4A, AAC and FLAC files for free, right in your browser. No uploads, no signup, no watermark — add fade in/out and download as MP3 or WAV.",
  keywords: [
    "mp3 cutter",
    "online mp3 cutter",
    "audio cutter",
    "audio trimmer",
    "trim mp3",
    "cut mp3 online",
    "wav cutter",
    "free audio editor",
    "cut audio without upload",
  ],
  badge: "Runs 100% in your browser",
  heading: { before: "Cut audio with", highlight: "studio precision" },
  intro:
    "Trim intros, remove silence, or grab the perfect clip. Free, private, and fast — your audio is never uploaded anywhere.",
  icon: icons.scissors,
  features: [
    privacyFeature,
    {
      title: "Studio-grade export",
      body: "MP3 up to 320 kbps or lossless WAV, with smooth fade in and fade out.",
      icon: icons.sparkles,
    },
    freeFeature,
  ],
  stepsTitle: "How to cut an MP3 online",
  steps: [
    { title: "Drop your file", body: "MP3, WAV, OGG, M4A, AAC or FLAC." },
    { title: "Select the part", body: "Drag the handles on the waveform." },
    { title: "Preview & polish", body: "Play the clip and add fades." },
    { title: "Download", body: "Export as MP3 or WAV in one click." },
  ],
  faqs: [
    {
      question: "Is SnipAudio really free?",
      answer:
        "Yes. Cutting, fading and exporting are completely free with no watermark, no signup and no limit on the number of files.",
    },
    privacyFaq,
    formatsFaq,
    {
      question: "Does it work on phones and tablets?",
      answer:
        "Yes. SnipAudio runs in any modern browser on Android, iPhone, iPad, Windows, macOS and Linux — there is nothing to install.",
    },
  ],
};

export const ringtoneMaker: Tool = {
  path: "/ringtone-maker",
  name: "Ringtone Maker",
  tagline: "Turn any song into a 30-second ringtone with fades.",
  metaTitle: "Ringtone Maker — Make a Ringtone from Any Song Online, Free",
  description:
    "Make a ringtone from any song in seconds. Pick the best 30 seconds, add a smooth fade in and out, and download as MP3 — free, no signup, and your music never leaves your device.",
  keywords: [
    "ringtone maker",
    "make ringtone online",
    "ringtone cutter",
    "mp3 ringtone maker",
    "custom ringtone",
    "free ringtone maker",
    "song to ringtone",
  ],
  badge: "Ringtone-ready in 30 seconds",
  heading: { before: "Make a ringtone from", highlight: "any song" },
  intro:
    "We pre-select a 30-second clip with smooth fades — just slide it to your favourite part and download. Free, private, no app needed.",
  icon: icons.bell,
  features: [
    {
      title: "Perfect length, preset",
      body: "Starts with a 30-second selection (capped at 40s, the iPhone limit) and gentle fades applied.",
      icon: icons.bell,
    },
    privacyFeature,
    freeFeature,
  ],
  stepsTitle: "How to make a ringtone online",
  steps: [
    { title: "Drop your song", body: "Any MP3, M4A, WAV or other audio file." },
    { title: "Slide the clip", body: "Drag the 30-second window to the best part." },
    { title: "Fine-tune fades", body: "Preview and adjust the fade in and out." },
    { title: "Download", body: "Save as MP3 and set it as your ringtone." },
  ],
  faqs: [
    {
      question: "How long should a ringtone be?",
      answer:
        "Around 20–30 seconds works best. Android accepts any length, while iPhone ringtones are limited to 40 seconds, so the selection here is capped at 40 seconds.",
    },
    {
      question: "How do I set the ringtone on Android?",
      answer:
        "Download the MP3, then open Settings → Sound → Phone ringtone and choose the file from your Downloads folder. Some phones list it under “Add ringtone” or “Custom”.",
    },
    {
      question: "Can I use it on iPhone?",
      answer:
        "Yes. iPhone ringtones have to go through Apple's GarageBand app: download the clip, import it into a GarageBand project on your iPhone, then use Share → Ringtone.",
    },
    privacyFaq,
  ],
};

export const audioJoiner: Tool = {
  path: "/audio-joiner",
  name: "Audio Joiner",
  tagline: "Merge multiple MP3 or WAV files into one track.",
  metaTitle: "Audio Joiner — Merge MP3 Files Online Free (No Upload)",
  description:
    "Join multiple MP3, WAV, M4A, OGG or FLAC files into a single track. Reorder clips, add gaps and fades, and download as MP3 or WAV — free and entirely in your browser.",
  keywords: [
    "audio joiner",
    "merge mp3",
    "join mp3 files",
    "combine audio files",
    "mp3 merger online",
    "merge songs",
    "audio merger",
  ],
  badge: "Merge unlimited tracks for free",
  heading: { before: "Join audio files into", highlight: "one seamless track" },
  intro:
    "Drop in your songs, voice notes or podcast segments, put them in order, and export a single file. Nothing is uploaded — it all happens on your device.",
  icon: icons.link,
  features: [
    {
      title: "Any mix of formats",
      body: "Combine MP3, WAV, M4A, OGG and FLAC in one go — they are matched automatically.",
      icon: icons.link,
    },
    privacyFeature,
    {
      title: "Gaps & fades",
      body: "Add silence between tracks and a fade in/out across the whole mix.",
      icon: icons.sparkles,
    },
  ],
  stepsTitle: "How to merge MP3 files online",
  steps: [
    { title: "Add your files", body: "Drop several audio files at once." },
    { title: "Set the order", body: "Move tracks up or down, remove extras." },
    { title: "Choose options", body: "Gap between tracks, fades and format." },
    { title: "Join & download", body: "Get one merged MP3 or WAV file." },
  ],
  faqs: [
    {
      question: "How many files can I join?",
      answer:
        "There is no fixed limit. Because merging happens in your browser, the practical limit is your device's memory — a few hours of audio works fine on most computers.",
    },
    {
      question: "Can I join files with different formats or sample rates?",
      answer:
        "Yes. Every file is decoded and converted to a common sample rate before joining, and mono files are mixed up to stereo when needed.",
    },
    formatsFaq,
    privacyFaq,
  ],
};

const exportFaq: ToolFaq = {
  question: "Which formats can I download?",
  answer:
    "You can download MP3 (128, 192, 256 or 320 kbps) or lossless WAV. MP3 at 192 kbps is a good default for music and voice.",
};

const qualityFeature: ToolFeature = {
  title: "MP3 or lossless WAV",
  body: "Export MP3 from 128 to 320 kbps, or uncompressed WAV for maximum quality.",
  icon: icons.sparkles,
};

export const audioConverter: Tool = {
  path: "/audio-converter",
  effect: "convert",
  name: "Audio Converter",
  tagline: "Convert WAV, M4A, OGG, FLAC and more to MP3 or WAV.",
  metaTitle: "Audio Converter — Convert WAV, M4A, FLAC to MP3 Online Free",
  description:
    "Convert WAV, M4A, OGG, AAC, FLAC and WEBM audio to MP3 or WAV for free. Pick your bitrate, convert instantly in your browser — no upload, no signup.",
  keywords: ["audio converter", "wav to mp3", "m4a to mp3", "flac to mp3", "ogg to mp3", "mp3 to wav", "convert audio online"],
  badge: "Convert in seconds, no upload",
  heading: { before: "Convert any audio to", highlight: "MP3 or WAV" },
  intro:
    "Drop in a WAV, M4A, OGG, AAC or FLAC file and get a clean MP3 or WAV back. Conversion happens on your device, so even large files never get uploaded.",
  icon: icons.convert,
  features: [qualityFeature, privacyFeature, freeFeature],
  stepsTitle: "How to convert audio to MP3",
  steps: [
    { title: "Drop your file", body: "WAV, M4A, OGG, AAC, FLAC or WEBM." },
    { title: "Pick a format", body: "MP3 or lossless WAV." },
    { title: "Choose quality", body: "128–320 kbps for MP3." },
    { title: "Download", body: "Your converted file saves instantly." },
  ],
  faqs: [
    {
      question: "Which formats can I convert from?",
      answer:
        "Anything your browser can decode: MP3, WAV, M4A, AAC, OGG, FLAC and WEBM in all modern browsers. Some browsers (like Safari) also open AIFF and CAF.",
    },
    exportFaq,
    {
      question: "Does converting to MP3 reduce quality?",
      answer:
        "MP3 is a compressed format, so a tiny amount of detail is lost. At 256 or 320 kbps the difference is inaudible for most listeners. Choose WAV if you need a lossless copy.",
    },
    privacyFaq,
  ],
};

export const videoToMp3: Tool = {
  path: "/video-to-mp3",
  effect: "video-to-mp3",
  name: "Video to MP3",
  tagline: "Extract the audio track from MP4, MOV or WEBM videos.",
  metaTitle: "Video to MP3 — Extract Audio from MP4 Video Online Free",
  description:
    "Extract audio from MP4, MOV, WEBM and MKV videos and save it as MP3 or WAV. Free, fast, and private — your video is processed in your browser, never uploaded.",
  keywords: ["video to mp3", "mp4 to mp3", "extract audio from video", "mov to mp3", "webm to mp3", "video to audio converter"],
  badge: "Your video never leaves your device",
  heading: { before: "Pull the audio out of", highlight: "any video" },
  intro:
    "Turn an MP4, MOV or WEBM into an MP3 in a few seconds — perfect for saving a song, lecture or voice clip from your own recordings.",
  icon: icons.video,
  features: [
    {
      title: "Works with common video formats",
      body: "MP4, MOV, M4V and WEBM in every modern browser; MKV in Chrome and Edge.",
      icon: icons.video,
    },
    privacyFeature,
    qualityFeature,
  ],
  stepsTitle: "How to convert video to MP3",
  steps: [
    { title: "Drop your video", body: "MP4, MOV, WEBM, MKV or M4V." },
    { title: "Wait a moment", body: "The audio track is decoded locally." },
    { title: "Pick quality", body: "MP3 up to 320 kbps, or WAV." },
    { title: "Download", body: "Save the extracted audio." },
  ],
  faqs: [
    {
      question: "Is there a file size limit?",
      answer:
        "There is no upload limit because nothing is uploaded, but the whole video is read into your device's memory. Videos up to a few hundred MB work well on most computers; very large files may fail on phones.",
    },
    {
      question: "Why won't my video open?",
      answer:
        "Your browser needs to understand the video's audio codec. MP4 (AAC) and WEBM (Opus) work everywhere; MKV and some MOV files only work in certain browsers. Try Chrome or Edge if a file fails.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const volumeBooster: Tool = {
  path: "/volume-booster",
  effect: "volume",
  name: "Volume Booster",
  tagline: "Make quiet MP3s louder — without harsh clipping.",
  metaTitle: "Volume Booster — Increase MP3 Volume Online Free",
  description:
    "Make quiet audio louder online. Boost MP3 volume by up to +20 dB or normalize it automatically, with a built-in limiter to prevent distortion. Free and private.",
  keywords: ["volume booster", "increase mp3 volume", "make audio louder", "mp3 volume booster", "normalize audio", "audio amplifier online"],
  badge: "Up to +20 dB with smart limiting",
  heading: { before: "Make quiet audio", highlight: "loud and clear" },
  intro:
    "Boost or reduce volume with a single slider, or let us normalize it for you. A soft limiter keeps peaks smooth so louder doesn't mean distorted.",
  icon: icons.speaker,
  features: [
    {
      title: "Smart limiter",
      body: "Peaks are softly limited instead of hard-clipped, so boosted audio stays clean.",
      icon: icons.speaker,
    },
    {
      title: "One-click normalize",
      body: "Raise the level as far as it can go without clipping, automatically.",
      icon: icons.sparkles,
    },
    privacyFeature,
  ],
  stepsTitle: "How to increase MP3 volume",
  steps: [
    { title: "Drop your file", body: "Any MP3, WAV, M4A or other audio." },
    { title: "Set the boost", body: "Drag the slider or turn on normalize." },
    { title: "Preview", body: "Compare the original and the result." },
    { title: "Download", body: "Save the louder version." },
  ],
  faqs: [
    {
      question: "How much louder can I make it?",
      answer:
        "Up to +20 dB, which is about 10× the amplitude. For most recordings +6 to +10 dB is plenty; beyond that, the limiter starts to audibly squash loud parts.",
    },
    {
      question: "What does normalize do?",
      answer:
        "Normalize finds the loudest moment in your file and raises the whole track until that peak sits just below the maximum level, so it gets as loud as possible without clipping.",
    },
    {
      question: "Can I make audio quieter too?",
      answer: "Yes — drag the slider below 0 dB (down to −12 dB) to reduce the volume.",
    },
    privacyFaq,
  ],
};

export const speedChanger: Tool = {
  path: "/change-audio-speed",
  effect: "speed",
  name: "Audio Speed Changer",
  tagline: "Speed up or slow down audio, with or without changing pitch.",
  metaTitle: "Change Audio Speed — Speed Up or Slow Down MP3 Online Free",
  description:
    "Speed up or slow down any MP3 or audio file from 0.5× to 2× — keep the original pitch or change it tape-style. Free, private and processed in your browser.",
  keywords: ["change audio speed", "speed up audio", "slow down mp3", "audio speed changer", "speed up song", "slowed audio", "nightcore maker"],
  badge: "0.5× to 2× with pitch lock",
  heading: { before: "Speed up or slow down", highlight: "any audio" },
  intro:
    "Make podcasts faster, slow songs down to learn them, or create sped-up and slowed edits. Keep the original pitch or let it shift naturally.",
  icon: icons.forward,
  features: [
    {
      title: "Pitch lock",
      body: "Change the tempo while keeping voices and instruments at their natural pitch.",
      icon: icons.forward,
    },
    {
      title: "Sped-up & slowed edits",
      body: "Turn pitch lock off for the classic tape-style sped-up or slowed sound.",
      icon: icons.sparkles,
    },
    privacyFeature,
  ],
  stepsTitle: "How to change audio speed",
  steps: [
    { title: "Drop your file", body: "Song, podcast or voice note." },
    { title: "Set the speed", body: "Anywhere from 0.5× to 2×." },
    { title: "Pick pitch mode", body: "Keep pitch, or let it follow speed." },
    { title: "Download", body: "Preview, then save as MP3 or WAV." },
  ],
  faqs: [
    {
      question: "What's the difference between the two modes?",
      answer:
        "With “Keep original pitch” on, only the tempo changes — voices sound natural, just faster or slower. With it off, the audio is played faster or slower like a tape, so the pitch rises or falls too (the popular sped-up / slowed style).",
    },
    {
      question: "Will the quality drop?",
      answer:
        "Small changes (0.8×–1.3×) sound very natural. Extreme changes with pitch lock on can introduce slight warbling — that's normal for time-stretching.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const pitchShifter: Tool = {
  path: "/pitch-shifter",
  effect: "pitch",
  name: "Pitch Shifter",
  tagline: "Change the key of a song without changing its speed.",
  metaTitle: "Pitch Shifter — Change the Pitch of a Song Online Free",
  description:
    "Shift the pitch of any song or audio up or down by up to 12 semitones while keeping the original tempo. Free online key changer — no upload, no signup.",
  keywords: ["pitch shifter", "change pitch of song", "key changer", "transpose audio", "pitch changer online", "change key of song"],
  badge: "±12 semitones, tempo locked",
  heading: { before: "Change the key of", highlight: "any song" },
  intro:
    "Transpose music to fit your vocal range, or tune a backing track to your instrument. The tempo stays exactly the same.",
  icon: icons.note,
  features: [
    {
      title: "Semitone precision",
      body: "Move up or down one semitone at a time, a full octave in either direction.",
      icon: icons.note,
    },
    {
      title: "Tempo stays put",
      body: "The length and rhythm are unchanged — only the key moves.",
      icon: icons.forward,
    },
    privacyFeature,
  ],
  stepsTitle: "How to change the pitch of a song",
  steps: [
    { title: "Drop your song", body: "MP3, WAV, M4A or any audio." },
    { title: "Pick semitones", body: "−12 to +12 from the original key." },
    { title: "Preview", body: "Listen before you download." },
    { title: "Download", body: "Save as MP3 or WAV." },
  ],
  faqs: [
    {
      question: "What is a semitone?",
      answer:
        "A semitone is the smallest step in Western music — one piano key. Moving 12 semitones changes the pitch by a full octave. To go from C to D, shift +2.",
    },
    {
      question: "Does it change the speed?",
      answer: "No. The pitch is shifted using time-stretching and resampling, so the song keeps its original length and tempo.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const silenceRemover: Tool = {
  path: "/remove-silence",
  effect: "silence",
  name: "Silence Remover",
  tagline: "Cut long pauses out of recordings automatically.",
  metaTitle: "Remove Silence from Audio — Auto Cut Pauses Online Free",
  description:
    "Automatically remove silence and long pauses from podcasts, lectures and voice recordings. Adjustable threshold, smooth joins, free and processed in your browser.",
  keywords: ["remove silence from audio", "silence remover", "cut pauses audio", "trim silence mp3", "remove dead air", "podcast silence remover"],
  badge: "Tighten recordings automatically",
  heading: { before: "Remove silence and", highlight: "dead air" },
  intro:
    "Tighten podcasts, lectures and voice notes by cutting out long pauses automatically. Tune the threshold, preview the result, and download.",
  icon: icons.mute,
  features: [
    {
      title: "Adjustable detection",
      body: "Set how quiet counts as silence and how long a pause must be before it's cut.",
      icon: icons.mute,
    },
    {
      title: "Natural-sounding joins",
      body: "A little breathing room is kept around each cut, with tiny crossfades to avoid clicks.",
      icon: icons.sparkles,
    },
    privacyFeature,
  ],
  stepsTitle: "How to remove silence from audio",
  steps: [
    { title: "Drop your recording", body: "Podcast, lecture or voice note." },
    { title: "Tune detection", body: "Threshold and minimum pause length." },
    { title: "Preview", body: "See how much silence was removed." },
    { title: "Download", body: "Save the tightened file." },
  ],
  faqs: [
    {
      question: "What threshold should I use?",
      answer:
        "Start with −45 dB. If background noise means nothing is removed, raise it towards −35 dB. If quiet words are being cut, lower it towards −55 dB.",
    },
    {
      question: "Will it cut the gaps between words?",
      answer:
        "Only pauses longer than the minimum you choose (0.6 s by default) are removed, and a short padding is kept on each side, so normal speech rhythm stays intact.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const fadeTool: Tool = {
  path: "/fade-in-fade-out",
  effect: "fade",
  name: "Fade In & Fade Out",
  tagline: "Add smooth fade in and fade out to any track.",
  metaTitle: "Fade In & Fade Out Audio Online — Free MP3 Fader",
  description:
    "Add a smooth fade in and fade out to MP3, WAV and other audio files — up to 20 seconds each. Free, instant, and processed privately in your browser.",
  keywords: ["fade in fade out", "fade audio online", "mp3 fade out", "add fade to mp3", "audio fader", "fade out song"],
  badge: "Up to 20-second fades",
  heading: { before: "Add smooth fades to", highlight: "any track" },
  intro:
    "Ease your audio in and out instead of starting or stopping abruptly — ideal for ringtones, intros, background music and mixes.",
  icon: icons.trend,
  features: [
    {
      title: "Long, smooth fades",
      body: "Fade in and out independently, from 0 up to 20 seconds each.",
      icon: icons.trend,
    },
    privacyFeature,
    qualityFeature,
  ],
  stepsTitle: "How to add fade in and fade out",
  steps: [
    { title: "Drop your file", body: "MP3, WAV, M4A or other audio." },
    { title: "Set the fades", body: "Choose fade in and fade out length." },
    { title: "Pick a format", body: "MP3 or WAV." },
    { title: "Download", body: "Save your faded track." },
  ],
  faqs: [
    {
      question: "How long should a fade be?",
      answer:
        "1–3 seconds sounds natural for most music; 5–10 seconds gives a slow, cinematic fade-out. Ringtones usually work best with a short 1-second fade in.",
    },
    {
      question: "Can I fade only part of the song?",
      answer:
        "Fades apply to the start and end of the file. To fade a specific section, cut it first with the MP3 Cutter, which also has fade controls.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const reverseAudio: Tool = {
  path: "/reverse-audio",
  effect: "reverse",
  name: "Reverse Audio",
  tagline: "Play any song or voice clip backwards.",
  metaTitle: "Reverse Audio — Play MP3 Backwards Online Free",
  description:
    "Reverse any song, voice note or sound effect and play it backwards. Free online audio reverser — preview instantly and download as MP3 or WAV, no upload.",
  keywords: ["reverse audio", "play audio backwards", "reverse mp3", "reverse song", "backwards audio", "audio reverser"],
  badge: "Instant reverse, no upload",
  heading: { before: "Play any audio", highlight: "backwards" },
  intro:
    "Uncover hidden messages, create reverse-reverb effects, or just have fun with your voice. Drop a file and hear it backwards in a second.",
  icon: icons.uturn,
  features: [
    {
      title: "Instant preview",
      body: "Hear the reversed result right away before you download.",
      icon: icons.uturn,
    },
    privacyFeature,
    qualityFeature,
  ],
  stepsTitle: "How to reverse audio",
  steps: [
    { title: "Drop your file", body: "Any song, voice note or sound." },
    { title: "Preview", body: "Hear it backwards instantly." },
    { title: "Pick a format", body: "MP3 or WAV." },
    { title: "Download", body: "Save the reversed audio." },
  ],
  faqs: [
    {
      question: "Can I reverse only part of a song?",
      answer: "Cut the part you want with the MP3 Cutter first, then reverse that clip here.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const voiceRecorder: Tool = {
  path: "/voice-recorder",
  name: "Voice Recorder",
  tagline: "Record your voice in the browser and save it as MP3.",
  metaTitle: "Online Voice Recorder — Record Audio & Save as MP3 Free",
  description:
    "Record your voice or any sound from your microphone directly in the browser, then download it as MP3 or WAV. Free, no signup, and recordings stay on your device.",
  keywords: ["online voice recorder", "record audio online", "voice recorder mp3", "microphone recorder", "record voice online free"],
  badge: "Recordings stay on your device",
  heading: { before: "Record your voice,", highlight: "save as MP3" },
  intro:
    "Click the mic, speak, and download a clean MP3 or WAV. No app to install, and your recording is never uploaded.",
  icon: icons.mic,
  features: [
    {
      title: "Live level meter",
      body: "See your input level while you record so you know the mic is working.",
      icon: icons.mic,
    },
    privacyFeature,
    qualityFeature,
  ],
  stepsTitle: "How to record your voice online",
  steps: [
    { title: "Click the mic", body: "Allow microphone access when asked." },
    { title: "Record", body: "Speak, sing or play — watch the meter." },
    { title: "Stop & listen", body: "Play back your recording." },
    { title: "Download", body: "Save as MP3 or WAV." },
  ],
  faqs: [
    {
      question: "Why isn't my microphone working?",
      answer:
        "Your browser asks for permission the first time. If you blocked it, click the camera/mic icon in the address bar, allow the microphone, and reload the page.",
    },
    {
      question: "Is there a time limit?",
      answer: "No fixed limit — recordings are held in your browser's memory, so very long sessions depend on your device.",
    },
    exportFaq,
    privacyFaq,
  ],
};

export const addAudioToSong: Tool = {
  path: "/add-audio-to-song",
  name: "Add Audio to Song",
  tagline: "Insert a clip, voice-over or sound effect anywhere in a song.",
  metaTitle: "Add Audio to a Song at Any Point — Insert or Overlay Online Free",
  description:
    "Insert audio into the middle of any song, or mix a voice-over or sound effect on top at the exact second you choose. Free, no upload — everything runs in your browser.",
  keywords: [
    "add audio to song",
    "insert audio into mp3",
    "add voice to song",
    "add sound effect to audio",
    "mix two audio files",
    "overlay audio online",
    "add voice over to music",
  ],
  badge: "Insert or overlay at any second",
  heading: { before: "Add audio into", highlight: "the middle of any song" },
  intro:
    "Pick the exact spot on the waveform, drop in your clip, and choose whether the song pauses for it or it plays on top. Preview the edit, then download.",
  icon: icons.plus,
  features: [
    {
      title: "Insert or mix on top",
      body: "Splice the clip in so the song resumes after it, or overlay it like a voice-over.",
      icon: icons.plus,
    },
    {
      title: "Auto-ducking",
      body: "When mixing on top, the song dips smoothly so your voice or effect stays clear.",
      icon: icons.speaker,
    },
    privacyFeature,
  ],
  stepsTitle: "How to add audio to a song",
  steps: [
    { title: "Drop the song", body: "MP3, WAV, M4A or any audio." },
    { title: "Pick the spot", body: "Click the waveform or nudge to the exact second." },
    { title: "Add your clip", body: "Choose insert or mix on top, set its volume." },
    { title: "Preview & download", body: "Hear the edit, then save as MP3 or WAV." },
  ],
  faqs: [
    {
      question: "What's the difference between Insert and Mix on top?",
      answer:
        "Insert splits the song at your chosen point, plays your clip, then continues the song — the result gets longer. Mix on top plays your clip over the song at that point, like a voice-over or sound effect, so the length stays the same (unless the clip runs past the end).",
    },
    {
      question: "How do I choose the exact position?",
      answer:
        "Click anywhere on the waveform, drag the pink marker, or use the ±0.1s, ±1s and ±5s buttons to fine-tune. “Hear 3s before the point” plays the lead-up so you can check the timing.",
    },
    {
      question: "Can I add only part of a clip?",
      answer:
        "Trim the clip to the part you want with the MP3 Cutter first, then add the trimmed file here.",
    },
    privacyFaq,
  ],
};

export const autoEnhance: Tool = {
  path: "/auto-enhance",
  name: "Auto Enhance",
  tagline: "Turn a home recording into a finished, radio-ready song.",
  metaTitle: "Auto Enhance Audio — Make Your Vocal Recording Sound Professional",
  description:
    "Upload a song you sang over a backing track and get a finished master: the tool measures loudness, dynamics, tonal balance, noise and sibilance, applies the corrections your recording needs, then adds a studio finish — warmth, sheen, a stereo double and a plate room. Runs entirely in your browser.",
  keywords: [
    "auto enhance audio",
    "online audio mastering",
    "enhance song quality",
    "improve vocal recording",
    "ai audio enhancer",
    "master a song online",
    "audio enhancer free",
    "clean up vocal recording",
    "make my voice sound professional",
    "studio vocal effect online",
  ],
  badge: "Premium · analysed on your device",
  heading: { before: "Make your recording", highlight: "sound like a record" },
  intro:
    "Drop in a song you sang over a backing track. We measure the loudness, dynamics, tonal balance, noise floor and sibilance, build a mastering chain for that specific recording, then finish it the way a playback vocal is finished — saturated, doubled and sitting in a plate room. Every decision is shown to you.",
  icon: icons.wand,
  features: [
    {
      title: "Measured, not guessed",
      body: "Gated LUFS loudness, crest factor, spectral balance and a noise floor estimate decide every move.",
      icon: icons.trend,
    },
    {
      title: "The playback finish",
      body: "Correction alone cannot make a phone take sound like a record — production does. Harmonic warmth, top-end sheen, a wide stereo double and a plate room put your voice in a song instead of a bedroom.",
      icon: icons.mic,
    },
    privacyFeature,
  ],
  stepsTitle: "How to auto-enhance a song",
  steps: [
    { title: "Drop your recording", body: "MP3, WAV, M4A, FLAC — vocal, instrumental or a full mix." },
    { title: "Read the analysis", body: "See the loudness, tonal balance and what we found." },
    { title: "Preview the result", body: "A/B the before and after, and adjust the strength." },
    { title: "Download the master", body: "Export as 320 kbps MP3 or lossless WAV." },
  ],
  faqs: [
    {
      question: "What does auto-enhance actually change?",
      answer:
        "Only what the measurements call for. It can remove DC offset and sub-sonic rumble, pull down a noisy background, correct the tonal balance with gentle EQ, de-ess a harsh vocal, even out the dynamics, widen an unusually narrow stereo image, and bring the track to a target loudness through a look-ahead limiter. Every step is listed on screen with the reason it ran — and steps that aren't needed are skipped and reported as skipped.",
    },
    {
      question: "I recorded myself singing over a backing track — will it work?",
      answer:
        "That's what it's tuned for. The analysis looks for syllable-paced energy in the vocal range plus sustained backing underneath, and when it finds both it protects the voice: de-essing instead of a blanket treble cut, a presence lift around 2.6 kHz so the words sit in front, and mid/side widening that leaves the centred vocal untouched.",
    },
    {
      question: "Can it fix a bad recording?",
      answer:
        "It can make a decent recording noticeably better. It can't undo clipping that was recorded in, restore frequencies a low-bitrate file never had, or separate a vocal from a backing track. Where the source limits what's possible, the analysis says so rather than quietly boosting hiss.",
    },
    {
      question: "What's free and what's premium?",
      answer:
        "The full analysis and a 30-second enhanced preview are free. Premium unlocks full-length exports, 320 kbps MP3 and lossless WAV, and manual control over each enhancement module.",
    },
    privacyFaq,
  ],
};

export const tools: Tool[] = [
  mp3Cutter,
  autoEnhance,
  audioConverter,
  videoToMp3,
  audioJoiner,
  addAudioToSong,
  ringtoneMaker,
  volumeBooster,
  speedChanger,
  pitchShifter,
  silenceRemover,
  fadeTool,
  reverseAudio,
  voiceRecorder,
];

export const getToolBySlug = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.path === `/${slug}`);
