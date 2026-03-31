# 🎮 1C vs Programming Languages

Игра в стиле **Agar.io**, где ты играешь за 1С и соревнуешься с языками программирования 🚀

---

## 🧠 Описание

Ты управляешь "1С" и:

* поедаешь меньшие объекты
* избегаешь более крупных
* растёшь и становишься сильнее

Против тебя играют боты:

*  Python
* ️ C++
*  Java
*  JavaScript

---

## 🚀 Запуск проекта
### Деплой на Vercel:

https://1c-game.vercel.app/


### Локально:
```bash
npm install
npm run dev
```

Открой в браузере:
```
http://localhost:5173
```

---

##  Геймплей

* **Space** — разделиться
* **W** — выбросить массу

Цель: стать самым большим на карте 

---

## ⚙️ Технологии

* TypeScript
* PixiJS (рендеринг)
* Vite (сборка)

---





## 📁 Структура проекта

```
1c/
├── public/
│ ├── icons/
│ └── legenda.png
│
├── src/
│ ├── game/
│ │ ├── Systems/
│ │ │ ├── CollisionSystem.ts
│ │ │ ├── MovementSystem.ts
│ │ │ ├── RenderSystem.ts
│ │ │ └── SpawnSystem.ts
│ │ │
│ │ ├── AI.ts
│ │ ├── Bot.ts
│ │ ├── Camera.ts
│ │ ├── Entity.ts
│ │ ├── Food.ts
│ │ ├── Game.ts
│ │ ├── Player.ts
│ │ └── World.ts
│ │
│ └── main.ts
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

---

