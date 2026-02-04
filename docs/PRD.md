# Product Requirements Document (PRD) - EchoNative

| Version | Date       | Author | Status |
| :--- | :--- | :--- | :--- |
| v0.1    | 2026-02-04 | Jyong & AI | Draft  |

## 1. Product Overview
**EchoNative** solves the "confidence gap" in language learning. Most learners know the grammar but are afraid to speak because they dislike their own accent. By letting them hear "themselves" speaking perfectly, we create a positive feedback loop.

## 2. User Persona
- **The "Mute" Learner:** High vocabulary, high reading score, but cannot speak fluently.
- **The Job Seeker:** Needs to improve professional English communication quickly.
- **The Social Sharer:** Likes to share progress and cool tech on social media.

## 3. Detailed Feature Requirements

### 3.1 Smart Prompter (Core Loop)
*   **User Story:** As a user, I want to practice speaking with guidance so I don't feel lost.
*   **Functional Req:**
    *   **Input:** Audio (User voice).
    *   **Process:** STT -> Grammar Check -> LLM Correction -> TTS (Voice Cloning).
    *   **Output:** Audio (Corrected, User's Voice) + Text (Diff view showing corrections).
    *   **Latency Goal:** < 2 seconds.

### 3.2 Guitar Hero Mode (Intonation Visualization)
*   **User Story:** As a user, I want visual feedback on my tone so I can improve without knowing IPA (phonetic symbols).
*   **UI/UX:**
    *   Top track: Native speaker's pitch curve (static).
    *   Bottom track: User's real-time pitch curve (dynamic).
    *   "Hit" markers for stress points.
*   **Tech:** Pitch extraction algorithm (e.g., crepe, parselmouth).

### 3.3 Magic Clip (Viral Feature)
*   **User Story:** As a user, I want to share a cool video of "me" speaking in a movie.
*   **Workflow:**
    1.  Select a clip (e.g., *The Godfather*, *Friends*).
    2.  Read the subtitle line.
    3.  AI generates audio with user's timbre + actor's emotion.
    4.  (Optional) Lip-sync modification (Wav2Lip) for high-end tier.
    5.  Export video with watermark.

### 3.4 Panic Button
*   **User Story:** As a user, I am stuck in a conversation and need immediate help.
*   **UI:** Big red button on home screen.
*   **Interaction:** Press & Hold -> Speak Chinese -> Release -> Play English Translation (User Voice).

## 4. Non-Functional Requirements
*   **Privacy:** Voice samples must be encrypted. User can delete voice model at any time.
*   **Performance:** "Real-time" feel is critical. Use streaming APIs where possible.
*   **Scalability:** Voice cloning is GPU intensive. Need queue management for free users.

## 5. Monetization Strategy (Draft)
*   **Freemium:** 10 "Echoes" per day. Standard voices only.
*   **Pro ($9.99/mo):** Unlimited Echoes. "Magic Clip" export without watermark. Custom Voice Model (Instant Cloning).
