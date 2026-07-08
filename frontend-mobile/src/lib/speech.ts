import * as Speech from 'expo-speech'

// Voz para crianças TEA: fala pausada, em português, sem sobreposição.
// Sempre interrompe a fala anterior — duas vozes ao mesmo tempo causam
// sobrecarga sensorial.

const SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: 'pt-BR',
  rate: 0.9,   // levemente mais lento que o normal
  pitch: 1.0,
}

export function speak(text: string): void {
  if (!text.trim()) return
  Speech.stop()
  Speech.speak(text, SPEECH_OPTIONS)
}

export function stopSpeaking(): void {
  Speech.stop()
}
