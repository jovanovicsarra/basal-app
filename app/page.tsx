'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Company = {
  id: string
  name: string
  pib: string
  city: string
}

type Transaction = {
  id: string
  date: string
  amount: number
  type: string
  description: string
  company_id: string | null
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [pib, setPib] = useState('')
  const [city, setCity] = useState('')

  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState<'income' | 'expense'>('income')
  const [txDescription, setTxDescription] = useState('')
  const [txDate, setTxDate] = useState('')

  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCompanies()
    loadTransactions()
  }, [])

  async function loadCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Greška pri učitavanju firmi: ' + error.message)
      return
    }

    setCompanies(data || [])
  }

  async function loadTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      setMessage('Greška pri učitavanju transakcija: ' + error.message)
      return
    }

    setTransactions((data || []).map((t) => ({ ...t, amount: Number(t.amount) })))
  }

  async function addCompany() {
    setMessage('')

    if (!name.trim() || !city.trim()) {
      setMessage('Unesi bar naziv firme i grad.')
      return
    }

    const { error } = await supabase.from('companies').insert([
      {
        name: name.trim(),
        pib: pib.trim(),
        city: city.trim(),
      },
    ])

    if (error) {
      setMessage('Greška pri dodavanju firme: ' + error.message)
      return
    }

    setName('')
    setPib('')
    setCity('')
    setMessage('Firma uspešno dodata.')
    loadCompanies()
  }

  async function addTransaction() {
    setMessage('')

    if (!selectedCompany) {
      setMessage('Prvo izaberi firmu.')
      return
    }

    if (!txAmount.trim() || !txDescription.trim() || !txDate.trim()) {
      setMessage('Unesi amount, description i date.')
      return
    }

    const numericAmount = Number(txAmount)

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setMessage('Amount mora biti pozitivan broj.')
      return
    }

    const finalAmount = txType === 'expense' ? -numericAmount : numericAmount

    const { error } = await supabase.from('transactions').insert([
      {
        amount: finalAmount,
        type: txType,
        description: txDescription.trim(),
        date: txDate,
        company_id: selectedCompany,
      },
    ])

    if (error) {
      setMessage('Greška pri dodavanju transakcije: ' + error.message)
      return
    }

    setTxAmount('')
    setTxDescription('')
    setTxDate('')
    setTxType('income')
    setMessage('Transakcija uspešno dodata.')
    loadTransactions()
  }

  async function handleCommand(command: string) {
    if (!selectedCompany) {
      setMessage('Prvo izaberi firmu.')
      return
    }

    const cleanCommand = command.trim()
    if (!cleanCommand) return

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cleanCommand }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setMessage('AI greška: ' + (data.error || 'unknown error'))
        return
      }

      const type = data.type === 'expense' ? 'expense' : 'income'
      const amount = Math.abs(Number(data.amount))
      const description = data.description || cleanCommand

      if (!amount || Number.isNaN(amount)) {
        setMessage('AI nije našao iznos.')
        return
      }

      const finalAmount = type === 'expense' ? -amount : amount

      const { error } = await supabase.from('transactions').insert([
        {
          company_id: selectedCompany,
          amount: finalAmount,
          type,
          description,
          date: new Date().toISOString().slice(0, 10),
        },
      ])

      if (error) {
        setMessage('Greška pri unosu: ' + error.message)
        return
      }

      setMessage('AI command executed.')
      loadTransactions()
    } catch (err: any) {
      setMessage('Fetch error: ' + err.message)
    }
  }

  async function deleteTransaction(id: string) {
    const confirmDelete = confirm('Da li si sigurna da želiš da obrišeš?')
    if (!confirmDelete) return

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) {
      setMessage('Greška pri brisanju: ' + error.message)
      return
    }

    loadTransactions()
  }

  const filteredTransactions = useMemo(() => {
    if (!selectedCompany) return []
    return transactions.filter((t) => t.company_id === selectedCompany)
  }, [transactions, selectedCompany])

  const selectedCompanyData = useMemo(() => {
    return companies.find((c) => c.id === selectedCompany) || null
  }, [companies, selectedCompany])

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income' || t.amount > 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }, [filteredTransactions])

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense' || t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }, [filteredTransactions])

  const netResult = totalIncome - totalExpense

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', background: '#000', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: 24, fontSize: 32 }}>Basal Companies</h1>

      {message && (
        <div style={{ marginBottom: 20, padding: 12, border: '1px solid #222', borderRadius: 10, background: '#0a0a0a', maxWidth: 520 }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 22 }}>Add company</h2>

            <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input placeholder="PIB" value={pib} onChange={(e) => setPib(e.target.value)} style={inputStyle} />
            <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />

            <button onClick={addCompany} style={buttonStyle}>Add company</button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 22 }}>Companies</h2>

            {companies.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCompany(c.id)}
                style={{
                  marginBottom: 10,
                  cursor: 'pointer',
                  padding: 14,
                  border: '1px solid #333',
                  background: selectedCompany === c.id ? '#10161a' : '#050505',
                  color: selectedCompany === c.id ? '#00e5ff' : 'white',
                  borderRadius: 10,
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{c.name}</div>
                <div style={{ color: selectedCompany === c.id ? '#9cf6ff' : '#bbb' }}>
                  {c.city} — {c.pib}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedCompanyData ? (
            <>
              <div style={cardStyle}>
                <h2 style={{ margin: 0, fontSize: 26 }}>{selectedCompanyData.name} — overview</h2>
                <div style={{ marginTop: 8, color: '#999' }}>
                  {selectedCompanyData.city} • PIB {selectedCompanyData.pib}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={cardStyle}>
                  <div style={{ color: '#999', marginBottom: 8 }}>Total income</div>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: '#00e676' }}>€{totalIncome}</div>
                </div>

                <div style={cardStyle}>
                  <div style={{ color: '#999', marginBottom: 8 }}>Total expense</div>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff5252' }}>€{totalExpense}</div>
                </div>

                <div style={cardStyle}>
                  <div style={{ color: '#999', marginBottom: 8 }}>Net result</div>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: netResult >= 0 ? '#00e5ff' : '#ff9800' }}>
                    €{netResult}
                  </div>
                </div>
              </div>

              <div style={{ ...cardStyle, maxWidth: 520 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 22 }}>AI Command</h3>

                <input
                  placeholder='Try: "Platila sam 300 za dobavljača"'
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      await handleCommand(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  style={inputStyle}
                />

                <p style={{ color: '#777', marginTop: -4, marginBottom: 22 }}>
                  Try: “Spent 200 on marketing” or “Primili smo uplatu 1200 od klijenta”
                </p>

                <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 22 }}>Add transaction</h3>

                <input placeholder="Amount (€)" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} style={inputStyle} />

                <select value={txType} onChange={(e) => setTxType(e.target.value as 'income' | 'expense')} style={inputStyle}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <input placeholder="Description" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} style={inputStyle} />

                <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} style={inputStyle} />

                <button onClick={addTransaction} style={buttonStyle}>Add transaction</button>
              </div>

              <div>
                <h3 style={{ marginBottom: 16, fontSize: 22 }}>Transactions</h3>

                {filteredTransactions.length === 0 ? (
                  <div style={{ ...cardStyle, maxWidth: 520 }}>
                    No transactions yet. Add your first one.
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div key={t.id} style={{ ...cardStyle, maxWidth: 560, position: 'relative' }}>
                      <button onClick={() => deleteTransaction(t.id)} style={deleteButtonStyle}>X</button>

                      <div
                        style={{
                          display: 'inline-block',
                          marginBottom: 10,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: t.type === 'income' ? '#0f2a19' : '#2a1010',
                          color: t.type === 'income' ? '#61ff9b' : '#ff8a80',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          fontSize: 12,
                        }}
                      >
                        {t.type}
                      </div>

                      <div>Date: {t.date}</div>
                      <div>Amount: €{t.amount}</div>
                      <div>Description: {t.description}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, color: '#999' }}>
              Izaberi firmu da vidiš overview i transakcije.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block',
  marginBottom: 10,
  padding: 12,
  width: '100%',
  borderRadius: 8,
  border: '1px solid #333',
  background: '#111',
  color: 'white',
  outline: 'none',
} as const

const buttonStyle = {
  width: '100%',
  padding: 12,
  cursor: 'pointer',
  background: '#00e5ff',
  color: '#000',
  border: 'none',
  borderRadius: 10,
  fontWeight: 'bold',
} as const

const cardStyle = {
  marginBottom: 20,
  padding: 20,
  border: '1px solid #222',
  borderRadius: 14,
  background: '#0a0a0a',
} as const

const deleteButtonStyle = {
  position: 'absolute',
  top: 10,
  right: 10,
  background: '#ff3b3b',
  border: 'none',
  borderRadius: 6,
  padding: '4px 8px',
  cursor: 'pointer',
  color: 'white',
  fontSize: 12,
} as const
