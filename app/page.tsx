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
  category?: string | null
}

type Task = {
  id: string
  company_id: string | null
  title: string
  assigned_to?: string | null
  due_date?: string | null
  priority?: string | null
  status?: string | null
  created_at?: string | null
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [pib, setPib] = useState('')
  const [city, setCity] = useState('')

  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState<'income' | 'expense'>('income')
  const [txDescription, setTxDescription] = useState('')
  const [txDate, setTxDate] = useState('')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignedTo, setTaskAssignedTo] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'normal' | 'high'>('normal')

  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCompanies()
    loadTransactions()
    loadTasks()
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

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Greška pri učitavanju taskova: ' + error.message)
      return
    }

    setTasks(data || [])
  }

  function detectCategory(lower: string) {
    if (lower.includes('marketing') || lower.includes('ads') || lower.includes('reklama') || lower.includes('instagram') || lower.includes('facebook')) return 'marketing'
    if (lower.includes('rent') || lower.includes('kirija') || lower.includes('zakup')) return 'rent'
    if (lower.includes('salary') || lower.includes('plata') || lower.includes('plate')) return 'salary'
    if (lower.includes('supplier') || lower.includes('dobavljač') || lower.includes('dobavljac') || lower.includes('roba')) return 'supplier'
    if (lower.includes('client') || lower.includes('klijent') || lower.includes('kupac')) return 'client'
    if (lower.includes('tax') || lower.includes('porez') || lower.includes('pdv')) return 'tax'
    if (lower.includes('bank') || lower.includes('banka') || lower.includes('fee') || lower.includes('provizija')) return 'bank fees'
    return 'other'
  }

  function parseTaskCommand(text: string) {
    const lower = text.toLowerCase()
    const words = text.trim().split(/\s+/)

    let assignedTo = ''
    if (words.length > 0) assignedTo = words[0]

    let priority: 'low' | 'normal' | 'high' = 'normal'
    if (lower.includes('high priority') || lower.includes('hitno') || lower.includes('urgent')) priority = 'high'
    if (lower.includes('low priority') || lower.includes('nije hitno')) priority = 'low'

    let dueDate = ''
    const today = new Date()

    if (lower.includes('sutra') || lower.includes('tomorrow')) {
      const d = new Date(today)
      d.setDate(today.getDate() + 1)
      dueDate = d.toISOString().slice(0, 10)
    }

    if (lower.includes('petak') || lower.includes('friday')) {
      dueDate = 'Friday'
    }

    const title = text
      .replace(/dodaj task/gi, '')
      .replace(/add task/gi, '')
      .replace(/podseti/gi, '')
      .replace(/remind/gi, '')
      .trim()

    return {
      title: title || text,
      assignedTo,
      dueDate,
      priority,
    }
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

    const lower = txDescription.toLowerCase()
    const category = detectCategory(lower)
    const finalAmount = txType === 'expense' ? -numericAmount : numericAmount

    const { error } = await supabase.from('transactions').insert([
      {
        amount: finalAmount,
        type: txType,
        description: txDescription.trim(),
        category,
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
    setMessage(`Dodato: ${txType} €${numericAmount} / ${category}`)
    loadTransactions()
  }

  async function addTask() {
    setMessage('')

    if (!selectedCompany) {
      setMessage('Prvo izaberi firmu.')
      return
    }

    if (!taskTitle.trim()) {
      setMessage('Unesi naziv taska.')
      return
    }

    const { error } = await supabase.from('tasks').insert([
      {
        company_id: selectedCompany,
        title: taskTitle.trim(),
        assigned_to: taskAssignedTo.trim() || null,
        due_date: taskDueDate || null,
        priority: taskPriority,
        status: 'open',
      },
    ])

    if (error) {
      setMessage('Greška pri dodavanju taska: ' + error.message)
      return
    }

    setTaskTitle('')
    setTaskAssignedTo('')
    setTaskDueDate('')
    setTaskPriority('normal')
    setMessage('Task uspešno dodat.')
    loadTasks()
  }

  async function handleCommand(command: string) {
    if (!selectedCompany) {
      setMessage('Prvo izaberi firmu.')
      return
    }

    const text = command.trim()
    if (!text) return

    const lower = text.toLowerCase()

    const looksLikeTask =
      lower.includes('task') ||
      lower.includes('podseti') ||
      lower.includes('remind') ||
      lower.includes('zadatak') ||
      lower.includes('uradi') ||
      lower.includes('ponuda') ||
      lower.includes('posalji') ||
      lower.includes('pošalji')

    const amountMatch = text.match(/-?\d+(\.\d+)?/)
    const amount = amountMatch ? Math.abs(Number(amountMatch[0])) : 0

    if (looksLikeTask && !amount) {
      const parsed = parseTaskCommand(text)

      const { error } = await supabase.from('tasks').insert([
        {
          company_id: selectedCompany,
          title: parsed.title,
          assigned_to: parsed.assignedTo,
          due_date: parsed.dueDate || null,
          priority: parsed.priority,
          status: 'open',
        },
      ])

      if (error) {
        setMessage('Greška pri unosu taska: ' + error.message)
        return
      }

      setMessage(`Task created: ${parsed.title}`)
      loadTasks()
      return
    }

    if (!amount || Number.isNaN(amount)) {
      setMessage('Nisam našao iznos. Primer: platila 300 za marketing ili Ana ponuda za Metalac do petka high priority')
      return
    }

    const isExpense =
      lower.includes('spent') ||
      lower.includes('paid') ||
      lower.includes('expense') ||
      lower.includes('trošak') ||
      lower.includes('trosak') ||
      lower.includes('platio') ||
      lower.includes('platila') ||
      lower.includes('kupila') ||
      lower.includes('kupili') ||
      lower.includes('rashod')

    const isIncome =
      lower.includes('received') ||
      lower.includes('income') ||
      lower.includes('revenue') ||
      lower.includes('uplata') ||
      lower.includes('primili') ||
      lower.includes('zaradili') ||
      lower.includes('prihod')

    const type = isExpense ? 'expense' : isIncome ? 'income' : 'income'
    const finalAmount = type === 'expense' ? -amount : amount
    const category = detectCategory(lower)

    const { error } = await supabase.from('transactions').insert([
      {
        company_id: selectedCompany,
        amount: finalAmount,
        type,
        description: text,
        category,
        date: new Date().toISOString().slice(0, 10),
      },
    ])

    if (error) {
      setMessage('Greška pri unosu: ' + error.message)
      return
    }

    setMessage(`Dodato: ${type} €${amount} / ${category}`)
    loadTransactions()
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

  async function toggleTaskStatus(task: Task) {
    const nextStatus = task.status === 'done' ? 'open' : 'done'

    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', task.id)

    if (error) {
      setMessage('Greška pri promeni taska: ' + error.message)
      return
    }

    loadTasks()
  }

  async function deleteTask(id: string) {
    const confirmDelete = confirm('Da li si sigurna da želiš da obrišeš task?')
    if (!confirmDelete) return

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      setMessage('Greška pri brisanju taska: ' + error.message)
      return
    }

    loadTasks()
  }

  const filteredTransactions = useMemo(() => {
    if (!selectedCompany) return []
    return transactions.filter((t) => t.company_id === selectedCompany)
  }, [transactions, selectedCompany])

  const filteredTasks = useMemo(() => {
    if (!selectedCompany) return []
    return tasks.filter((t) => t.company_id === selectedCompany)
  }, [tasks, selectedCompany])

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

  const openTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status !== 'done')
  }, [filteredTasks])

  const highPriorityTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.priority === 'high' && t.status !== 'done')
  }, [filteredTasks])

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'expense' || t.amount < 0)
  }, [filteredTransactions])

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}

    expenseTransactions.forEach((t) => {
      const cat = t.category || 'other'
      if (!map[cat]) map[cat] = 0
      map[cat] += Math.abs(t.amount)
    })

    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [expenseTransactions])

  const warnings = useMemo(() => {
    const items: string[] = []

    if (netResult < 0) {
      items.push(`Net result is negative: €${netResult}. Company is currently losing money.`)
    }

    const topCategory = categoryTotals[0]
    if (topCategory && totalExpense > 0) {
      const percent = Math.round((topCategory.total / totalExpense) * 100)

      if (percent >= 50) {
        items.push(`${topCategory.category} represents ${percent}% of spending. This cost area needs review.`)
      }

      if (topCategory.category === 'other' && percent >= 30) {
        items.push(`Too much spending is uncategorized. Add clearer descriptions to improve analysis.`)
      }
    }

    if (totalIncome > 0 && totalExpense / totalIncome > 0.8) {
      items.push('Expenses are above 80% of income. Margin pressure is high.')
    }

    if (highPriorityTasks.length > 0) {
      items.push(`${highPriorityTasks.length} high priority task(s) are still open.`)
    }

    if (items.length === 0 && (filteredTransactions.length > 0 || filteredTasks.length > 0)) {
      items.push('No critical warning detected. Company looks stable based on current data.')
    }

    return items
  }, [netResult, categoryTotals, totalExpense, totalIncome, filteredTransactions.length, filteredTasks.length, highPriorityTasks.length])

  const recentActivity = useMemo(() => {
    const transactionEvents = filteredTransactions.slice(0, 5).map((t) => ({
      id: `tx-${t.id}`,
      label: `${t.type === 'expense' || t.amount < 0 ? 'Expense' : 'Income'} €${Math.abs(t.amount)}`,
      meta: `${t.date} • ${t.category || 'other'} • ${t.description}`,
    }))

    const taskEvents = filteredTasks.slice(0, 5).map((t) => ({
      id: `task-${t.id}`,
      label: `Task ${t.status === 'done' ? 'completed' : 'created'}: ${t.title}`,
      meta: `${t.assigned_to || 'Unassigned'} • ${t.priority || 'normal'} priority • ${t.due_date || 'no due date'}`,
    }))

    return [...transactionEvents, ...taskEvents].slice(0, 8)
  }, [filteredTransactions, filteredTasks])

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', background: '#000', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: 24, fontSize: 32 }}>Basal Companies</h1>

      {message && (
        <div style={{ marginBottom: 20, padding: 12, border: '1px solid #222', borderRadius: 10, background: '#0a0a0a', maxWidth: 620 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
                <MetricCard title="Total income" value={`€${totalIncome}`} color="#00e676" />
                <MetricCard title="Total expense" value={`€${totalExpense}`} color="#ff5252" />
                <MetricCard title="Net result" value={`€${netResult}`} color={netResult >= 0 ? '#00e5ff' : '#ff9800'} />
                <MetricCard title="Open tasks" value={`${openTasks.length}`} color="#ffffff" />
              </div>

              <div style={{ ...cardStyle, maxWidth: 760 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Command center</h3>

                <input
                  placeholder='Try: "platila 300 za marketing" or "Ana ponuda za Metalac do petka high priority"'
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      await handleCommand(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  style={inputStyle}
                />

                <p style={{ color: '#777', marginTop: -4, marginBottom: 0 }}>
                  One input for finance and operations.
                </p>
              </div>

              <div style={{ ...cardStyle, maxWidth: 760 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Basal warnings</h3>

                {warnings.map((warning, index) => (
                  <div key={index} style={warningStyle}>
                    ⚠️ {warning}
                  </div>
                ))}
              </div>

              <div style={{ ...cardStyle, maxWidth: 760 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Tasks</h3>

                <input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} style={inputStyle} />
                <input placeholder="Assigned to" value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)} style={inputStyle} />
                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} style={inputStyle} />

                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as 'low' | 'normal' | 'high')} style={inputStyle}>
                  <option value="low">Low priority</option>
                  <option value="normal">Normal priority</option>
                  <option value="high">High priority</option>
                </select>

                <button onClick={addTask} style={buttonStyle}>Add task</button>

                <div style={{ marginTop: 18 }}>
                  {filteredTasks.length === 0 ? (
                    <div style={{ color: '#777' }}>No tasks yet.</div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={task.id} style={taskStyle}>
                        <button onClick={() => deleteTask(task.id)} style={smallDeleteButtonStyle}>X</button>

                        <div style={{ fontWeight: 'bold', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>

                        <div style={{ color: '#999', fontSize: 14, marginTop: 4 }}>
                          {task.assigned_to || 'Unassigned'} • {task.due_date || 'No due date'} • {task.priority || 'normal'} priority • {task.status || 'open'}
                        </div>

                        <button onClick={() => toggleTaskStatus(task)} style={secondaryButtonStyle}>
                          {task.status === 'done' ? 'Reopen' : 'Mark done'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ ...cardStyle, maxWidth: 760 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Spending by category</h3>

                {categoryTotals.length === 0 ? (
                  <div style={{ color: '#777' }}>No expense data yet.</div>
                ) : (
                  categoryTotals.map((c) => {
                    const percent = totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0

                    return (
                      <div key={c.category} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{c.category}</span>
                          <span>€{c.total} ({percent}%)</span>
                        </div>

                        <div style={{ height: 6, background: '#222', borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#00e5ff' }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div style={{ ...cardStyle, maxWidth: 760 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>Company timeline</h3>

                {recentActivity.length === 0 ? (
                  <div style={{ color: '#777' }}>No activity yet.</div>
                ) : (
                  recentActivity.map((item) => (
                    <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #1f1f1f' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                      <div style={{ color: '#999', fontSize: 14 }}>{item.meta}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ ...cardStyle, maxWidth: 520 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 22 }}>Add transaction manually</h3>

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
                      <div>Category: {t.category || 'other'}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ ...cardStyle, color: '#999' }}>
              Izaberi firmu da vidiš overview, taskove i transakcije.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ color: '#999', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 'bold', color }}>{value}</div>
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

const secondaryButtonStyle = {
  marginTop: 10,
  padding: '7px 10px',
  cursor: 'pointer',
  background: '#111',
  color: 'white',
  border: '1px solid #333',
  borderRadius: 8,
} as const

const cardStyle = {
  marginBottom: 20,
  padding: 20,
  border: '1px solid #222',
  borderRadius: 14,
  background: '#0a0a0a',
} as const

const warningStyle = {
  marginBottom: 10,
  padding: 12,
  borderRadius: 10,
  border: '1px solid #332600',
  background: '#151000',
  color: '#ffcc66',
} as const

const taskStyle = {
  position: 'relative',
  padding: 14,
  marginBottom: 10,
  border: '1px solid #222',
  borderRadius: 12,
  background: '#050505',
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

const smallDeleteButtonStyle = {
  position: 'absolute',
  top: 10,
  right: 10,
  background: '#ff3b3b',
  border: 'none',
  borderRadius: 6,
  padding: '3px 7px',
  cursor: 'pointer',
  color: 'white',
  fontSize: 11,
} as const