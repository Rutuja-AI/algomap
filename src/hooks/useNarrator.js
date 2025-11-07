import { useEffect, useRef, useState } from "react";

/**
 * useNarrator — Browser speech synthesis helper
 * ---------------------------------------------
 * Handles play, pause, stop, and line-based narration.
 * Works offline, zero API cost.
 *
 * Usage:
 * const { speakScript, stop, pause, resume, speaking } = useNarrator();
 * speakScript(scriptArray, onLineStart);
 */
export default function useNarrator() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const currentLineRef = useRef(0);
  const synth = window.speechSynthesis;

  // Stop all speech
  const stop = () => {
    synth.cancel();
    setSpeaking(false);
    setPaused(false);
    currentLineRef.current = 0;
  };

  const pause = () => {
    synth.pause();
    setPaused(true);
  };

  const resume = () => {
    synth.resume();
    setPaused(false);
  };

  /**
   * speakScript()
   * Plays a script array sequentially.
   * Each line = { t, say, intent, targets, label }
   */
  const speakScript = async (script = [], onLineStart = () => {}) => {
    if (!script.length) return;
    stop(); // reset
    setSpeaking(true);

    for (let i = 0; i < script.length; i++) {
      const line = script[i];
      currentLineRef.current = i;

      // call external handler (for animations)
      onLineStart(line);

      const utter = new SpeechSynthesisUtterance(line.say);
      utter.rate = 1; // speed
      utter.pitch = 1;
      utter.volume = 1;
      utter.lang = "en-US";

      // Wait for this utterance to finish before next
      await new Promise((resolve) => {
        utter.onend = resolve;
        synth.speak(utter);
      });

      // stop if narration interrupted
      if (!speaking) break;
    }

    setSpeaking(false);
  };

  useEffect(() => {
    return () => synth.cancel(); // cleanup on unmount
  }, []);

  return { speakScript, stop, pause, resume, speaking, paused };
}
