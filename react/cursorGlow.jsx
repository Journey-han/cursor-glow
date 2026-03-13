import { useEffect } from "react"
import cursorGlow from "../src/cursorGlow.js"

export default function CursorGlow(props) {

  useEffect(() => {

    const cursor = cursorGlow(props)

    return () => {
      cursor.destroy()
    }

  }, [])

  return null
}