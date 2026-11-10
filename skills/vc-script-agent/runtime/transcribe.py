import json, sys, pathlib, wave
import numpy as np
from faster_whisper import WhisperModel
root = pathlib.Path(__file__).resolve().parent.parent
cache = root / 'work' / 'asr-models'
model = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=6, download_root=str(cache))
if len(sys.argv) == 1:
    print(json.dumps({'ready': True}))
else:
    with wave.open(sys.argv[1], 'rb') as wav:
        assert wav.getnchannels() == 1 and wav.getframerate() == 16000 and wav.getsampwidth() == 2
        audio = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    segments, info = model.transcribe(audio, language='zh', beam_size=5, vad_filter=True, condition_on_previous_text=False)
    result = [{'start': round(s.start,2), 'end': round(s.end,2), 'text': s.text.strip()} for s in segments]
    pathlib.Path(sys.argv[2]).write_text(json.dumps({'language':info.language,'segments':result},ensure_ascii=False),encoding='utf-8')
    print(json.dumps({'segments':len(result)}))
