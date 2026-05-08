/**
 * Announces a student dismissal (kepulangan) using the Web Speech API.
 * Uses a short delay and resume workaround to prevent the speech from
 * being cut off by DOM changes (popups, re-renders).
 */
let announceTimeout: ReturnType<typeof setTimeout> | null = null;
let resumeInterval: ReturnType<typeof setInterval> | null = null;

export function announceDismissal(studentName: string, className: string) {
  if (!("speechSynthesis" in window)) return;

  if (announceTimeout) clearTimeout(announceTimeout);
  if (resumeInterval) clearInterval(resumeInterval);

  announceTimeout = setTimeout(() => {
    window.speechSynthesis.cancel();

    const text = `Perhatian. ${studentName}, kelas ${className}, sudah pulang. Terima kasih.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith("id"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onstart = () => {
      resumeInterval = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else if (resumeInterval) {
          clearInterval(resumeInterval);
        }
      }, 3000);
    };
    utterance.onend = () => {
      if (resumeInterval) clearInterval(resumeInterval);
    };
    utterance.onerror = () => {
      if (resumeInterval) clearInterval(resumeInterval);
    };

    window.speechSynthesis.speak(utterance);
  }, 500);
}
