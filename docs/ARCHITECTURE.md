# Technical Architecture - EchoNative

## 1. System Overview

EchoNative follows a **Client-Server architecture**.
- **Client (Mobile):** React Native (Future implementation) handling UI, Audio Recording, and Audio Playback.
- **Server (Backend):** Python (FastAPI) handling orchestration of AI services, user data, and business logic.

## 2. Backend Architecture

### 2.1 Technology Stack
- **Framework:** FastAPI (High performance, async support)
- **Runtime:** Python 3.10+
- **Testing:** Pytest
- **Documentation:** MkDocs / Swagger (Auto-generated)

### 2.2 Core Modules (`backend/app/`)

#### `core/`
- Configuration management (Env vars).
- Logging setup.
- Exception handling.

#### `services/`
This is the heart of the application.
- **`SpeechToTextService` (STT):** Interface for Whisper / Local models.
- **`LLMService`:** Interface for GPT-4o / Claude (Grammar correction, Dialogue generation).
- **`TextToSpeechService` (TTS):** Interface for ElevenLabs / XTTS (Voice Cloning).
- **`PitchAnalysisService`:** (For "Guitar Hero" mode) Extracts pitch data (F0) from audio.

#### `api/`
- REST Endpoints.
- Request/Response Models (Pydantic).

## 3. Data Flow (Smart Prompter)

1. **Upload:** Client uploads audio blob + Metadata (User ID, Current Context).
2. **Transcribe:** `SpeechToTextService` converts Audio -> Text.
3. **Analyze:** `LLMService` compares Text with Target.
    - If `mode == shadowing`: Check similarity.
    - If `mode == free_talk`: Fix grammar.
4. **Synthesize:** `TextToSpeechService` generates Audio using User's Voice ID.
5. **Response:** Server returns:
    - `audio_url`: URL to the perfected audio.
    - `correction_diff`: JSON showing changed words.
    - `pitch_data`: JSON series of pitch points for visualization.

## 4. Testing Strategy
- **Unit Tests:** Mock all external AI APIs. Test logic isolation.
- **Integration Tests:** Test API endpoints with mocked services.
