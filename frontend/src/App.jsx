import { useState } from 'react'
import './App.css'

function App() {
  const [inputValue, setInputValue] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) {
      setMessage('Por favor, ingresa un valor')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: inputValue }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Dato guardado exitosamente!')
        setInputValue('')
      } else {
        setMessage(data.error || 'Error al guardar el dato')
      }
    } catch (error) {
      setMessage('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <h1>Guardar Datos</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ingresa un valor..."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
      {message && (
        <div className={`message ${message.includes('exitosamente') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default App