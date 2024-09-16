import { useState } from 'react'

import './App.css'
import { DataTable } from './MaterialTable'
import MaterialTable from './MaterialTable'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <MaterialTable/>
    </>
  )
}

export default App
