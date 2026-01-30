// app/novo-carregamento/NovoCarregamentoForm.tsx
'use client'
import { useState } from 'react'
import { MapPinIcon, TruckIcon, UserIcon } from '@heroicons/react/24/outline'

const docas = Array.from({ length: 20 }, (_, i) => `Doca ${String(i + 1).padStart(2, '0')}`)
const cidades = ['Juazeiro-BA', 'Jacobina-BA', 'Valença-BA', 'Itaberaba-BA', 'Seabra-BA', 'Santo Antônio de Jesus', 'Pombal', 'Senhor do Bonfim', 'Serrinha' ]
const posicoes = Array.from({ length: 10 }, (_, i) => `${i + 1}º Carro`)

export default function NovoCarregamentoForm() {
  const [form, setForm] = useState({
    doca: '',
    cidade: '',
    posicao: '',
    motorista: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/carregamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    // Aqui você pode redirecionar ou mostrar mensagem de sucesso
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded-lg shadow space-y-6">
      <div className="flex items-center space-x-2">
        <TruckIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold">Novo carregamento</h1>
      </div>

      {/* Doca */}
      <div>
        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
          <MapPinIcon className="h-4 w-4 text-gray-500" />
          Doca
        </label>
        <select name="doca" required value={form.doca} onChange={handleChange}
          className="w-full border rounded px-3 py-2">
          <option value="">Selecione a doca</option>
          {docas.map(doca => (
            <option key={doca} value={doca}>{doca}</option>
          ))}
        </select>
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-sm font-medium mb-1">Cidade</label>
        <select name="cidade" required value={form.cidade} onChange={handleChange}
          className="w-full border rounded px-3 py-2">
          <option value="">Selecione a cidade</option>
          {cidades.map(cidade => (
            <option key={cidade} value={cidade}>{cidade}</option>
          ))}
        </select>
      </div>

      {/* Posição (Carrossel) */}
      <div>
        <label className="block text-sm font-medium mb-1">Posição</label>
        <div className="flex overflow-x-auto gap-2 py-2">
          {posicoes.map(posicao => (
            <button type="button"
              key={posicao}
              onClick={() => setForm({ ...form, posicao })}
              className={`px-4 py-2 rounded border ${form.posicao === posicao ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {posicao}
            </button>
          ))}
        </div>
      </div>

      {/* Motorista */}
      <div>
        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
          <UserIcon className="h-4 w-4 text-gray-500" />
          Motorista
        </label>
        <input
          name="motorista"
          required
          value={form.motorista}
          onChange={handleChange}
          placeholder="Nome do motorista"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition">
        Salvar carregamento
      </button>
    </form>
  )
}
