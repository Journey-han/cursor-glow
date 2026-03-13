# Cursor Glow ✨

Cursor Glow는 커서 주변에 glow + ring + particle trail 효과를 만들어주는 UI 라이브러리입니다.  
![cursorGlow](./demo/demo.gif)

🌎 언어
- [한국어](./README.ko.md)
- [English](./README.md)


## 설치
```bash
npm install cursor-glow
```


## 사용 방법
```js
import cursorGlow from "cursor-glow"

cursorGlow()
```


## 옵션
```css
cursorGlow({
  colorA:"#00ffff",
  colorB:"#8b5cf6",
  glowSize:120,
  trailCount:16
})
```


## 리액트 사용 예시
```jsx
import CursorGlow from "cursor-glow/react/CursorGlow"

function App() {
  return (
    <>
      <CursorGlow />
      <h1>Hello</h1>
    </>
  )
}
```


## 주요 기능
Glow 커서 효과  
Particle trail 애니메이션  
Hover 시 magnetic 효과  
Click pulse 애니메이션  
모든 프레임워크에서 사용 가능  


## 라이선스
MIT

---
⭐ 도움이 되셨다면 GitHub Star 부탁드립니다!