/**
 * AyahWebView Component
 * WebView-based ayah display with smooth word-by-word highlighting
 * No React re-render vibration!
 */

import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ayah } from '../../../types';

interface AyahWebViewProps {
  ayah: Ayah;
  currentWordIndex: number;
  isPlaying: boolean;
  showTranslation?: boolean;
}

export const AyahWebView: React.FC<AyahWebViewProps> = ({
  ayah,
  currentWordIndex,
  isPlaying,
  showTranslation = false,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [webViewHeight, setWebViewHeight] = useState(150);

  // Update highlighted word via JavaScript injection (no re-render!)
  useEffect(() => {
    if (webViewRef.current && isPlaying && currentWordIndex >= 0) {
      const js = `
        (function() {
          // Remove all previous highlights
          const allWords = document.querySelectorAll('.arabic-word');
          allWords.forEach((el) => {
            el.classList.remove('word-highlighted', 'word-fading');
          });

          // Highlight current word
          const currentWord = document.getElementById('word-${currentWordIndex}');
          if (currentWord) {
            currentWord.classList.add('word-highlighted');
          }
        })();
        true;
      `;

      webViewRef.current.injectJavaScript(js);
    }
  }, [currentWordIndex, isPlaying]);

  // Generate HTML with each word wrapped in a span
  const generateHTML = () => {
    // Split by spaces but filter out empty strings and single diacritics
    const words = ayah.text.split(' ').filter(word => {
      // Remove diacritics to check actual letter count
      const withoutDiacritics = word.replace(/[\u064B-\u0652\u0670]/g, '');
      // Keep only actual words with at least 2 Arabic letters (not single letters)
      return withoutDiacritics.length >= 2 && /[\u0600-\u06FF]/.test(word);
    });

    const wordsHTML = words
      .map((word, index) => {
        // Add space after each word except the last
        const space = index < words.length - 1 ? ' ' : '';
        // Pre-highlight first word if this is a playing ayah
        const highlightClass = isPlaying && index === 0 ? ' word-highlighted' : '';
        return `<span id="word-${index}" class="arabic-word${highlightClass}">${word}${space}</span>`;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Traditional Arabic', 'Scheherazade', serif;
            font-size: 22px;
            line-height: 1.8;
            padding: 0;
            margin: 0;
            direction: rtl;
            text-align: right;
            background-color: transparent;
          }

          .arabic-word {
            display: inline;
            transition: background-color 0.3s ease-in-out;
            padding: 2px 4px;
            border-radius: 4px;
            margin: 0 2px;
          }

          .word-highlighted {
            background-color: #FFEB3B !important;
          }

          .word-fading {
            background-color: transparent !important;
          }

          .ayah-number {
            font-size: 20px;
            color: #666;
            margin-left: 8px;
          }

          .translation {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-top: 16px;
            direction: ltr;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="arabic-text">
          ${wordsHTML}
          <span class="ayah-number">۝${ayah.number}</span>
        </div>
        ${
          showTranslation && ayah.translation
            ? `
          <div class="translation">
            ${ayah.translation}
          </div>
        `
            : ''
        }
      </body>
      </html>
    `;
  };

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: generateHTML() }}
      style={[styles.webview, { height: webViewHeight }]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      androidLayerType="software"
      injectedJavaScript={`
        // Send height to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          height: document.body.scrollHeight
        }));
      `}
      onMessage={event => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.height) {
            // Update WebView height dynamically
            setWebViewHeight(data.height + 10); // Add 10px padding
          }
        } catch (e) {
          // Ignore parse errors
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  webview: {
    backgroundColor: 'transparent',
    // Height set dynamically via state
  },
});

export default AyahWebView;
