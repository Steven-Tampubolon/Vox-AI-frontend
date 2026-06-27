# 🦊 Apa itu Vox-AI-frontend

Ini adalah Vox-AI frontend chat AI multi-karakter. Setiap karakter punya **kepribadian, system prompt, dan kemampuan** yang berbeda:

| Karakter | Slug | Kemampuan |
|---|---|---|
| 🎭 **Abang Betawi** | `betawi` | Ngobrol santai logat Betawi, balas & buat pantun 4 baris |
| 📄 **Dokter Dokumen** | `rag` | Tanya-jawab dari dokumen yang di-upload (PDF/TXT) via RAG |
| 🌿 **Git Master** | `git` | Bantu generate commit message & jelaskan Git workflow |
| 🧑‍🏫 **Profesor Analogi** | `explain` | Jelaskan konsep rumit pakai analogi sederhana |

Semua percakapan **disimpan permanen** di SQLite, lengkap dengan history per-conversation untuk konteks multi-turn.

---