'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type Company = { id: string; name: string; pib: string; city: string }
type Transaction = { id: string; date: string; amount: number; type: string; description: string; company_id: string | null; category?: string | null }
type Task = { id: string; company_id: string | null; title: string; assigned_to?: string | null; due_date?: string | null; priority?: string | null; status?: string | null; created_at?: string | null }
type Employee = { id: string; company_id: string | null; name: string; hourly_cost: number; hours_worked: number; value_generated: number }
type InventoryItem = { id: string; company_id: string | null; name: string; quantity: number; months_slow: number; discount: number }
type Invoice = { id: string; company_id: string | null; client: string; amount: number; due_date?: string | null; status?: string | null }

type ModuleKey =
  | 'command'
  | 'cashflow' | 'transactions' | 'invoices' | 'instantCash'
  | 'orders' | 'procurement' | 'manufacturing' | 'inventory' | 'warehouse' | 'supply'
  | 'tasks' | 'employees' | 'performance' | 'hr'
  | 'crm' | 'marketing' | 'ecommerce' | 'sales'
  | 'documents' | 'uploads' | 'memory'
  | 'companySetup' | 'users' | 'permissions'

const menuGroups: { title: string; items: { key: ModuleKey; label: string; icon: string }[] }[] = [
  { title: '1. Command Center', items: [{ key: 'command', label: 'Command Center', icon: '⌘' }] },
  {
    title: '2. Finance',
    items: [
      { key: 'cashflow', label: 'Cash Flow', icon: '€' },
      { key: 'transactions', label: 'Transactions', icon: '⇅' },
      { key: 'invoices', label: 'Invoices', icon: '□' },
      { key: 'instantCash', label: 'Instant Cash', icon: '⚡' },
    ],
  },
  {
    title: '3. Operations',
    items: [
      { key: 'orders', label: 'Orders', icon: '◫' },
      { key: 'procurement', label: 'Procurement', icon: '◈' },
      { key: 'manufacturing', label: 'Manufacturing', icon: '⚙' },
      { key: 'inventory', label: 'Inventory', icon: '▦' },
      { key: 'warehouse', label: 'Warehouse', icon: '⌂' },
      { key: 'supply', label: 'Supply Chain', icon: '⇄' },
    ],
  },
  {
    title: '4. People',
    items: [
      { key: 'tasks', label: 'Tasks', icon: '✓' },
      { key: 'employees', label: 'Employees', icon: '♙' },
      { key: 'performance', label: 'Performance', icon: '◷' },
      { key: 'hr', label: 'HR', icon: '◇' },
    ],
  },
  {
    title: '5. Growth',
    items: [
      { key: 'crm', label: 'CRM', icon: '◇' },
      { key: 'marketing', label: 'Marketing', icon: '◎' },
      { key: 'ecommerce', label: 'Ecommerce', icon: '◌' },
      { key: 'sales', label: 'Sales Pipeline', icon: '↗' },
    ],
  },
  {
    title: '6. Knowledge',
    items: [
      { key: 'documents', label: 'Documents', icon: '▤' },
      { key: 'uploads', label: 'Uploads', icon: '↑' },
      { key: 'memory', label: 'Company Memory', icon: '◉' },
    ],
  },
  {
    title: '7. Settings',
    items: [
      { key: 'companySetup', label: 'Company Setup', icon: '+' },
      { key: 'users', label: 'Users', icon: '♟' },
      { key: 'permissions', label: 'Permissions', icon: '◇' },
    ],
  },
]

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('command')

  const [companies, setCompanies] = useState<Company[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
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

  const [employeeName, setEmployeeName] = useState('')
  const [hourlyCost, setHourlyCost] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [valueGenerated, setValueGenerated] = useState('')

  const [itemName, setItemName] = useState('')
  const [itemQty, setItemQty] = useState('')
  const [itemSlowMonths, setItemSlowMonths] = useState('')

  const [invoiceClient, setInvoiceClient] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDue, setInvoiceDue] = useState('')

  const [stressAmount, setStressAmount] = useState('')
  const [chatText, setChatText] = useState('')
  const [companyMemory, setCompanyMemory] = useState<string[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (!selectedCompany && companies.length > 0) setSelectedCompany(companies[0].id)
  }, [companies, selectedCompany])

  async function loadAll() {
    await Promise.all([loadCompanies(), loadTransactions(), loadTasks(), loadEmployees(), loadInventory(), loadInvoices()])
  }

  async function loadCompanies() {
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    if (error) return setMessage('Greška pri učitavanju firmi: ' + error.message)
    setCompanies(data || [])
  }

  async function loadTransactions() {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    if (error) return setMessage('Greška pri učitavanju transakcija: ' + error.message)
    setTransactions((data || []).map((t) => ({ ...t, amount: Number(t.amount) })))
  }

  async function loadTasks() {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (error) return setMessage('Greška pri učitavanju taskova: ' + error.message)
    setTasks(data || [])
  }

  async function loadEmployees() {
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    if (error) return
    setEmployees((data || []).map((e) => ({
      ...e,
      hourly_cost: Number(e.hourly_cost),
      hours_worked: Number(e.hours_worked),
      value_generated: Number(e.value_generated),
    })))
  }

  async function loadInventory() {
    const { data, error } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false })
    if (error) return
    setInventory((data || []).map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      months_slow: Number(i.months_slow),
      discount: Number(i.discount),
    })))
  }

  async function loadInvoices() {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
    if (error) return
    setInvoices((data || []).map((i) => ({ ...i, amount: Number(i.amount) })))
  }

  const selectedCompanyData = useMemo(() => companies.find(c => c.id === selectedCompany) || null, [companies, selectedCompany])
  const filteredTransactions = useMemo(() => selectedCompany ? transactions.filter(t => t.company_id === selectedCompany) : [], [transactions, selectedCompany])
  const filteredTasks = useMemo(() => selectedCompany ? tasks.filter(t => t.company_id === selectedCompany) : [], [tasks, selectedCompany])
  const filteredEmployees = useMemo(() => selectedCompany ? employees.filter(e => e.company_id === selectedCompany) : [], [employees, selectedCompany])
  const filteredInventory = useMemo(() => selectedCompany ? inventory.filter(i => i.company_id === selectedCompany) : [], [inventory, selectedCompany])
  const filteredInvoices = useMemo(() => selectedCompany ? invoices.filter(i => i.company_id === selectedCompany) : [], [invoices, selectedCompany])

  const totalIncome = filteredTransactions.filter(t => t.type === 'income' || t.amount > 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' || t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const netResult = totalIncome - totalExpense
  const openTasks = filteredTasks.filter(t => t.status !== 'done')
  const highPriorityTasks = filteredTasks.filter(t => t.priority === 'high' && t.status !== 'done')
  const pendingInvoices = filteredInvoices.filter(i => i.status !== 'paid')
  const pendingInvoiceTotal = pendingInvoices.reduce((s, i) => s + Math.abs(i.amount), 0)
  const instantCashOffer = Math.round(pendingInvoiceTotal * 0.96)
  const factoringFee = pendingInvoiceTotal - instantCashOffer

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTransactions.filter(t => t.type === 'expense' || t.amount < 0).forEach(t => {
      const cat = t.category || 'other'
      map[cat] = (map[cat] || 0) + Math.abs(t.amount)
    })
    return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
  }, [filteredTransactions])

  const warnings = useMemo(() => {
    const items: string[] = []
    if (netResult < 0) items.push(`Net result is negative: €${netResult}. Company is currently losing money.`)
    if (totalIncome > 0 && totalExpense / totalIncome > 0.8) items.push('Expenses are above 80% of income. Margin pressure is high.')
    if (highPriorityTasks.length > 0) items.push(`${highPriorityTasks.length} high priority task(s) are still open.`)
    if (pendingInvoiceTotal > 0) items.push(`Pending invoices: €${pendingInvoiceTotal}. Instant cash estimate: €${instantCashOffer}.`)
    const top = categoryTotals[0]
    if (top && totalExpense > 0 && Math.round((top.total / totalExpense) * 100) >= 50) items.push(`${top.category} dominates spending. Review this cost area.`)
    if (items.length === 0 && selectedCompany) items.push('No critical warning detected. Company looks stable based on current data.')
    return items
  }, [netResult, totalIncome, totalExpense, highPriorityTasks.length, pendingInvoiceTotal, instantCashOffer, categoryTotals, selectedCompany])

  const cashStress = useMemo(() => {
    const purchase = Number(stressAmount) || 0
    const projected = netResult + pendingInvoiceTotal - purchase
    if (!purchase) return 'Enter a purchase amount to stress-test cash flow.'
    if (projected < 0) return `Do NOT buy now. Projected cash after this purchase: €${projected}.`
    return `Purchase looks possible. Projected cash after pending invoices and purchase: €${projected}.`
  }, [stressAmount, netResult, pendingInvoiceTotal])

  const recentActivity = [
    ...filteredTransactions.slice(0, 5).map(t => ({
      id: `tx-${t.id}`,
      label: `${t.type === 'expense' || t.amount < 0 ? 'Expense' : 'Income'} €${Math.abs(t.amount)}`,
      meta: `${t.date} • ${t.category || 'other'} • ${t.description}`,
    })),
    ...filteredTasks.slice(0, 5).map(t => ({
      id: `task-${t.id}`,
      label: `Task ${t.status === 'done' ? 'completed' : 'created'}: ${t.title}`,
      meta: `${t.assigned_to || 'Unassigned'} • ${t.priority || 'normal'} • ${t.due_date || 'no due date'}`,
    })),
    ...companyMemory.slice(0, 5).map((m, i) => ({
      id: `mem-${i}`,
      label: 'Company memory saved',
      meta: m,
    })),
  ].slice(0, 10)

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

    let priority: 'low' | 'normal' | 'high' = 'normal'
    if (lower.includes('high priority') || lower.includes('hitno') || lower.includes('urgent')) priority = 'high'
    if (lower.includes('low priority') || lower.includes('nije hitno')) priority = 'low'

    let dueDate = ''
    if (lower.includes('sutra') || lower.includes('tomorrow')) {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      dueDate = d.toISOString().slice(0, 10)
    }
    if (lower.includes('petak') || lower.includes('friday')) dueDate = 'Friday'

    const title = text.replace(/dodaj task/gi, '').replace(/add task/gi, '').replace(/podseti/gi, '').replace(/remind/gi, '').trim()
    return { title: title || text, assignedTo: words[0] || '', dueDate, priority }
  }

  async function addCompany() {
    if (!name.trim() || !city.trim()) return setMessage('Unesi bar naziv firme i grad.')
    const { error } = await supabase.from('companies').insert([{ name: name.trim(), pib: pib.trim(), city: city.trim() }])
    if (error) return setMessage('Greška pri dodavanju firme: ' + error.message)
    setName('')
    setPib('')
    setCity('')
    setMessage('Firma uspešno dodata.')
    loadCompanies()
  }

  async function addTransaction() {
    if (!selectedCompany) return setMessage('Prvo izaberi firmu.')
    if (!txAmount.trim() || !txDescription.trim() || !txDate.trim()) return setMessage('Unesi amount, description i date.')

    const numericAmount = Number(txAmount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return setMessage('Amount mora biti pozitivan broj.')

    const category = detectCategory(txDescription.toLowerCase())
    const finalAmount = txType === 'expense' ? -numericAmount : numericAmount

    const { error } = await supabase.from('transactions').insert([{
      amount: finalAmount,
      type: txType,
      description: txDescription.trim(),
      category,
      date: txDate,
      company_id: selectedCompany,
    }])

    if (error) return setMessage('Greška pri dodavanju transakcije: ' + error.message)

    setTxAmount('')
    setTxDescription('')
    setTxDate('')
    setTxType('income')
    setMessage(`Dodato: ${txType} €${numericAmount} / ${category}`)
    loadTransactions()
  }

  async function addTask() {
    if (!selectedCompany) return setMessage('Prvo izaberi firmu.')
    if (!taskTitle.trim()) return setMessage('Unesi naziv taska.')

    const { error } = await supabase.from('tasks').insert([{
      company_id: selectedCompany,
      title: taskTitle.trim(),
      assigned_to: taskAssignedTo.trim() || null,
      due_date: taskDueDate || null,
      priority: taskPriority,
      status: 'open',
    }])

    if (error) return setMessage('Greška pri dodavanju taska: ' + error.message)

    setTaskTitle('')
    setTaskAssignedTo('')
    setTaskDueDate('')
    setTaskPriority('normal')
    setMessage('Task uspešno dodat.')
    loadTasks()
  }

  async function addEmployee() {
    if (!selectedCompany) return setMessage('Prvo izaberi firmu.')
    if (!employeeName.trim()) return setMessage('Unesi ime radnika.')

    const { error } = await supabase.from('employees').insert([{
      company_id: selectedCompany,
      name: employeeName.trim(),
      hourly_cost: Number(hourlyCost) || 0,
      hours_worked: Number(hoursWorked) || 0,
      value_generated: Number(valueGenerated) || 0,
    }])

    if (error) return setMessage('Greška pri dodavanju radnika: ' + error.message)

    setEmployeeName('')
    setHourlyCost('')
    setHoursWorked('')
    setValueGenerated('')
    setMessage('Radnik dodat.')
    loadEmployees()
  }

  async function addInventoryItem() {
    if (!selectedCompany) return setMessage('Prvo izaberi firmu.')
    if (!itemName.trim()) return setMessage('Unesi naziv artikla.')

    const { error } = await supabase.from('inventory_items').insert([{
      company_id: selectedCompany,
      name: itemName.trim(),
      quantity: Number(itemQty) || 0,
      months_slow: Number(itemSlowMonths) || 0,
      discount: 20,
    }])

    if (error) return setMessage('Greška pri dodavanju artikla: ' + error.message)

    setItemName('')
    setItemQty('')
    setItemSlowMonths('')
    setMessage('Artikal dodat.')
    loadInventory()
  }

  async function addInvoice() {
    if (!selectedCompany) return setMessage('Prvo izaberi firmu.')
    if (!invoiceClient.trim() || !invoiceAmount.trim()) return setMessage('Unesi klijenta i iznos fakture.')

    const { error } = await supabase.from('invoices').insert([{
      company_id: selectedCompany,
      client: invoiceClient.trim(),
      amount: Number(invoiceAmount) || 0,
      due_date: invoiceDue || null,
      status: 'pending',
    }])

    if (error) return setMessage('Greška pri dodavanju fakture: ' + error.message)

    setInvoiceClient('')
    setInvoiceAmount('')
    setInvoiceDue('')
    setMessage('Faktura dodata.')
    loadInvoices()
  }

  async function handleCommand(command: string) {
    if (!selectedCompany) return setMessage('Prvo izaberi firmu.')

    const text = command.trim()
    if (!text) return

    const lower = text.toLowerCase()
    const amountMatch = text.match(/-?\d+(\.\d+)?/)
    const amount = amountMatch ? Math.abs(Number(amountMatch[0])) : 0

    const looksLikeTask =
      lower.includes('task') ||
      lower.includes('podseti') ||
      lower.includes('remind') ||
      lower.includes('zadatak') ||
      lower.includes('uradi') ||
      lower.includes('ponuda') ||
      lower.includes('posalji') ||
      lower.includes('pošalji')

    const looksLikeOrder =
      lower.includes('order') ||
      lower.includes('porudžbina') ||
      lower.includes('porudzbina') ||
      lower.includes('narudžbina') ||
      lower.includes('narudzbina')

    if (looksLikeOrder) {
      const parsed = parseTaskCommand(`Order created: ${text}`)

      await supabase.from('tasks').insert([
        {
          company_id: selectedCompany,
          title: `Check Inventory for order: ${text}`,
          assigned_to: parsed.assignedTo || null,
          due_date: parsed.dueDate || null,
          priority: 'high',
          status: 'open',
        },
        {
          company_id: selectedCompany,
          title: `Create Procurement request for order: ${text}`,
          assigned_to: parsed.assignedTo || null,
          due_date: parsed.dueDate || null,
          priority: 'normal',
          status: 'open',
        },
        {
          company_id: selectedCompany,
          title: `Prepare Manufacturing plan for order: ${text}`,
          assigned_to: parsed.assignedTo || null,
          due_date: parsed.dueDate || null,
          priority: 'normal',
          status: 'open',
        },
      ])

      setCompanyMemory(prev => [
        `Order created → checks Inventory → if missing stock, creates Procurement request → if production needed, creates Manufacturing task → assigns employee → affects Cash Flow forecast → updates Customer/CRM status → stores documents → Command Center explains what changed. Order: ${text}`,
        ...prev,
      ])

      setMessage('Order workflow executed across Operations, People, Finance, Growth and Knowledge.')
      setChatText('')
      loadTasks()
      return
    }

    if (looksLikeTask && !amount) {
      const p = parseTaskCommand(text)

      const { error } = await supabase.from('tasks').insert([{
        company_id: selectedCompany,
        title: p.title,
        assigned_to: p.assignedTo,
        due_date: p.dueDate || null,
        priority: p.priority,
        status: 'open',
      }])

      if (error) return setMessage('Greška pri unosu taska: ' + error.message)

      setMessage(`Task created: ${p.title}`)
      setChatText('')
      loadTasks()
      return
    }

    if (amount) {
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

      const { error } = await supabase.from('transactions').insert([{
        company_id: selectedCompany,
        amount: finalAmount,
        type,
        description: text,
        category,
        date: new Date().toISOString().slice(0, 10),
      }])

      if (error) return setMessage('Greška pri unosu: ' + error.message)

      setMessage(`Dodato: ${type} €${amount} / ${category}`)
      setChatText('')
      loadTransactions()
      return
    }

    setCompanyMemory(prev => [text, ...prev])
    setMessage('Saved to Company Memory.')
    setChatText('')
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Da li si sigurna da želiš da obrišeš?')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return setMessage('Greška pri brisanju: ' + error.message)
    loadTransactions()
  }

  async function toggleTaskStatus(task: Task) {
    const { error } = await supabase.from('tasks').update({ status: task.status === 'done' ? 'open' : 'done' }).eq('id', task.id)
    if (error) return setMessage('Greška pri promeni taska: ' + error.message)
    loadTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Da li si sigurna da želiš da obrišeš task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return setMessage('Greška pri brisanju taska: ' + error.message)
    loadTasks()
  }

  function HeaderMetrics() {
    return (
      <>
        <Panel title={`${selectedCompanyData?.name || 'Company'} — operating state`}>
          <div style={muted}>{selectedCompanyData?.city} • PIB {selectedCompanyData?.pib}</div>
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 16, marginBottom: 20 }}>
          <MetricCard title="Income" value={`€${totalIncome}`} color="#00e676" />
          <MetricCard title="Expense" value={`€${totalExpense}`} color="#ff5252" />
          <MetricCard title="Net" value={`€${netResult}`} color={netResult >= 0 ? '#00e5ff' : '#ff9800'} />
          <MetricCard title="Open tasks" value={`${openTasks.length}`} color="#ffffff" />
        </div>
      </>
    )
  }

  function CommandCenter() {
    return (
      <>
        <HeaderMetrics />

        <div style={chatShellStyle}>
          <div style={assistantBubbleStyle}>
            <b>BASAL</b>
            <p style={{ marginBottom: 0 }}>
              Send anything: expense, task, order, note, document summary, screenshot description, or operational instruction. I route it through the company nervous system.
            </p>
          </div>

          {warnings.map((w, i) => (
            <div key={i} style={warningStyle}>⚠️ {w}</div>
          ))}

          <div style={workflowStyle}>
            <b>Cross-functional workflow</b>
            <div>
              Order created → checks Inventory → if missing stock, creates Procurement request → if production needed, creates Manufacturing task → assigns employee → affects Cash Flow forecast → updates Customer/CRM status → stores documents → Command Center explains what changed.
            </div>
          </div>

          <div style={inputBarStyle}>
            <textarea
              placeholder='Message BASAL: "order 20 tables for Hotel Palace", "platila 300 za marketing", "Ana ponuda do petka high priority"...'
              value={chatText}
              onChange={e => setChatText(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  await handleCommand(chatText)
                }
              }}
              style={chatTextareaStyle}
            />
            <button onClick={() => handleCommand(chatText)} style={buttonStyle}>Send to BASAL</button>
          </div>
        </div>

        <Panel title="Company timeline">
          {recentActivity.length === 0 ? (
            <div style={muted}>No activity yet.</div>
          ) : recentActivity.map(item => (
            <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #1f1f1f' }}>
              <b>{item.label}</b>
              <div style={muted}>{item.meta}</div>
            </div>
          ))}
        </Panel>
      </>
    )
  }

  function FinanceModule() {
    return (
      <>
        <HeaderMetrics />

        <Panel title="Cash Flow">
          <input placeholder="Stress-test purchase amount, e.g. 20000" value={stressAmount} onChange={e => setStressAmount(e.target.value)} style={inputStyle} />
          <div style={insightStyle}>{cashStress}</div>
        </Panel>

        <Panel title="Transactions">
          <input placeholder="Amount (€)" value={txAmount} onChange={e => setTxAmount(e.target.value)} style={inputStyle} />
          <select value={txType} onChange={e => setTxType(e.target.value as 'income' | 'expense')} style={inputStyle}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input placeholder="Description" value={txDescription} onChange={e => setTxDescription(e.target.value)} style={inputStyle} />
          <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} style={inputStyle} />
          <button onClick={addTransaction} style={buttonStyle}>Add transaction</button>
        </Panel>

        <Panel title="Spending by category">
          {categoryTotals.length === 0 ? <div style={muted}>No expense data yet.</div> : categoryTotals.map(c => {
            const p = totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0
            return (
              <div key={c.category} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{c.category}</span>
                  <span>€{c.total} ({p}%)</span>
                </div>
                <div style={{ height: 6, background: '#222', borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ width: `${p}%`, height: '100%', background: '#00e5ff' }} />
                </div>
              </div>
            )
          })}
        </Panel>
      </>
    )
  }

  function TasksModule() {
    return (
      <Panel title="Tasks / Project Management">
        <input placeholder="Task title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} style={inputStyle} />
        <input placeholder="Assigned to" value={taskAssignedTo} onChange={e => setTaskAssignedTo(e.target.value)} style={inputStyle} />
        <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} style={inputStyle} />
        <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as 'low' | 'normal' | 'high')} style={inputStyle}>
          <option value="low">Low priority</option>
          <option value="normal">Normal priority</option>
          <option value="high">High priority</option>
        </select>
        <button onClick={addTask} style={buttonStyle}>Add task</button>

        <List>
          {filteredTasks.length === 0 ? <div style={muted}>No tasks yet.</div> : filteredTasks.map(task => (
            <div key={task.id} style={taskStyle}>
              <button onClick={() => deleteTask(task.id)} style={smallDeleteButtonStyle}>X</button>
              <b style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</b>
              <div style={muted}>{task.assigned_to || 'Unassigned'} • {task.due_date || 'No due date'} • {task.priority || 'normal'} • {task.status || 'open'}</div>
              <button onClick={() => toggleTaskStatus(task)} style={secondaryButtonStyle}>{task.status === 'done' ? 'Reopen' : 'Mark done'}</button>
            </div>
          ))}
        </List>
      </Panel>
    )
  }

  function EmployeesModule() {
    return (
      <Panel title="Employees / Performance / HR">
        <input placeholder="Employee name" value={employeeName} onChange={e => setEmployeeName(e.target.value)} style={inputStyle} />
        <input placeholder="Hourly cost" value={hourlyCost} onChange={e => setHourlyCost(e.target.value)} style={inputStyle} />
        <input placeholder="Hours worked" value={hoursWorked} onChange={e => setHoursWorked(e.target.value)} style={inputStyle} />
        <input placeholder="Value generated" value={valueGenerated} onChange={e => setValueGenerated(e.target.value)} style={inputStyle} />
        <button onClick={addEmployee} style={buttonStyle}>Add employee</button>

        <List>
          {filteredEmployees.length === 0 ? <div style={muted}>No employees yet.</div> : filteredEmployees.map(e => {
            const cost = e.hourly_cost * e.hours_worked
            const profit = e.value_generated - cost
            return (
              <div key={e.id} style={taskStyle}>
                <b>{e.name}</b>
                <div style={muted}>Cost: €{cost} • Value: €{e.value_generated} • Result: €{profit}</div>
              </div>
            )
          })}
        </List>
      </Panel>
    )
  }

  function OperationsModule() {
    return (
      <Panel title="Operations Center">
        <div style={workflowStyle}>Orders → Inventory → Procurement → Manufacturing → Warehouse → Supply Chain → People → Finance → CRM.</div>

        <input placeholder="Item name" value={itemName} onChange={e => setItemName(e.target.value)} style={inputStyle} />
        <input placeholder="Quantity" value={itemQty} onChange={e => setItemQty(e.target.value)} style={inputStyle} />
        <input placeholder="Months slow" value={itemSlowMonths} onChange={e => setItemSlowMonths(e.target.value)} style={inputStyle} />
        <button onClick={addInventoryItem} style={buttonStyle}>Add inventory item</button>

        <List>
          {filteredInventory.length === 0 ? <div style={muted}>No inventory yet.</div> : filteredInventory.map(i => (
            <div key={i.id} style={taskStyle}>
              <b>{i.name}</b>
              <div style={muted}>Qty: {i.quantity} • Slow: {i.months_slow} months</div>
              {i.months_slow >= 3 && <div style={insightStyle}>Marketing signal: suggest -{i.discount}% campaign.</div>}
            </div>
          ))}
        </List>
      </Panel>
    )
  }

  function GrowthModule() {
    return (
      <Panel title="Growth Center / CRM / Marketing / Ecommerce / Sales Pipeline">
        <input placeholder="Client" value={invoiceClient} onChange={e => setInvoiceClient(e.target.value)} style={inputStyle} />
        <input placeholder="Invoice amount" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} style={inputStyle} />
        <input type="date" value={invoiceDue} onChange={e => setInvoiceDue(e.target.value)} style={inputStyle} />
        <button onClick={addInvoice} style={buttonStyle}>Add invoice / deal</button>

        <div style={insightStyle}>Pending invoices: €{pendingInvoiceTotal}. Instant cash offer: €{instantCashOffer}. Fee: €{factoringFee}.</div>

        <List>
          {pendingInvoices.length === 0 ? <div style={muted}>No pending invoices yet.</div> : pendingInvoices.map(i => (
            <div key={i.id} style={taskStyle}>
              <b>{i.client}</b>
              <div style={muted}>€{i.amount} • due {i.due_date || 'unknown'} • {i.status}</div>
            </div>
          ))}
        </List>
      </Panel>
    )
  }

  function KnowledgeModule() {
    return (
      <Panel title="Knowledge Center / Documents / Uploads / Company Memory">
        <textarea
          placeholder="Paste document summary, screenshot interpretation, supplier info, client context, meeting note..."
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          style={chatTextareaStyle}
        />
        <button onClick={() => handleCommand(chatText)} style={buttonStyle}>Save to Company Memory</button>

        <List>
          {companyMemory.length === 0 ? <div style={muted}>No saved memory yet.</div> : companyMemory.map((m, i) => (
            <div key={i} style={taskStyle}>{m}</div>
          ))}
        </List>
      </Panel>
    )
  }

  function CompanySetup() {
    return (
      <>
        <Panel title="Active company">
          <select value={selectedCompany || ''} onChange={(e) => setSelectedCompany(e.target.value)} style={inputStyle}>
            <option value="">Select company</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Panel>

        <Panel title="Add company">
          <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input placeholder="PIB" value={pib} onChange={(e) => setPib(e.target.value)} style={inputStyle} />
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
          <button onClick={addCompany} style={buttonStyle}>Add company</button>
        </Panel>
      </>
    )
  }

  function renderActiveModule() {
    if (!selectedCompanyData && activeModule !== 'companySetup') return <CompanySetup />
    if (activeModule === 'command') return <CommandCenter />
    if (['cashflow', 'transactions', 'invoices', 'instantCash'].includes(activeModule)) return <FinanceModule />
    if (['orders', 'procurement', 'manufacturing', 'inventory', 'warehouse', 'supply'].includes(activeModule)) return <OperationsModule />
    if (activeModule === 'tasks') return <TasksModule />
    if (['employees', 'performance', 'hr'].includes(activeModule)) return <EmployeesModule />
    if (['crm', 'marketing', 'ecommerce', 'sales'].includes(activeModule)) return <GrowthModule />
    if (['documents', 'uploads', 'memory'].includes(activeModule)) return <KnowledgeModule />
    return <CompanySetup />
  }

  const activeLabel = menuGroups.flatMap(g => g.items).find(i => i.key === activeModule)?.label || 'Command Center'

  return (
    <div style={appStyle}>
      <aside style={sidebarStyle}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>BASAL</div>
          <div style={{ ...muted, marginTop: 4 }}>Company nervous system</div>
        </div>

        <div style={{ padding: 12 }}>
          <select value={selectedCompany || ''} onChange={(e) => setSelectedCompany(e.target.value)} style={companySelectStyle}>
            <option value="">No company selected</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <nav style={{ padding: 8 }}>
          {menuGroups.map(group => (
            <div key={group.title} style={{ marginBottom: 14 }}>
              <div style={groupTitleStyle}>{group.title}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveModule(item.key)}
                  style={{
                    ...sidebarButtonStyle,
                    background: activeModule === item.key ? '#10161a' : 'transparent',
                    color: activeModule === item.key ? '#00e5ff' : '#cfcfcf',
                    borderColor: activeModule === item.key ? '#183b42' : 'transparent',
                  }}
                >
                  <span style={{ width: 22 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main style={mainStyle}>
        <div style={topBarStyle}>
          <div>
            <div style={{ fontSize: 13, color: '#777' }}>Active module</div>
            <h1 style={{ margin: 0, fontSize: 28 }}>{activeLabel}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#777' }}>Active company</div>
            <div style={{ fontWeight: 700 }}>{selectedCompanyData?.name || 'None'}</div>
          </div>
        </div>

        {message && <div style={{ ...cardStyle, maxWidth: 900 }}>{message}</div>}
        {renderActiveModule()}
      </main>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ ...cardStyle, maxWidth: 900 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  )
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div style={muted}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 'bold', color }}>{value}</div>
    </div>
  )
}

function List({ children }: { children: ReactNode }) {
  return <div style={{ marginTop: 16 }}>{children}</div>
}

const muted = { color: '#999', fontSize: 14 } as const
const appStyle = { display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '100vh', background: '#000', color: 'white', fontFamily: 'Arial, sans-serif' } as const
const sidebarStyle = { borderRight: '1px solid #1f1f1f', background: '#050505', minHeight: '100vh', position: 'sticky', top: 0, overflowY: 'auto' } as const
const mainStyle = { padding: 28, maxWidth: 1180 } as const
const topBarStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid #1f1f1f' } as const
const groupTitleStyle = { color: '#777', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, padding: '8px 12px' } as const
const sidebarButtonStyle = { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 3, border: '1px solid transparent', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontWeight: 600 } as const
const companySelectStyle = { width: '100%', padding: 11, borderRadius: 10, border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' } as const
const chatShellStyle = { maxWidth: 900, minHeight: 520, border: '1px solid #222', borderRadius: 18, background: '#050505', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 } as const
const assistantBubbleStyle = { alignSelf: 'flex-start', maxWidth: 720, padding: 16, borderRadius: 16, background: '#0d0d0d', border: '1px solid #222', color: '#e8e8e8' } as const
const inputBarStyle = { marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: 16 } as const
const inputStyle = { display: 'block', marginBottom: 10, padding: 12, width: '100%', borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white', outline: 'none' } as const
const chatTextareaStyle = { display: 'block', marginBottom: 10, padding: 14, width: '100%', minHeight: 80, borderRadius: 12, border: '1px solid #333', background: '#111', color: 'white', outline: 'none', resize: 'vertical' } as const
const buttonStyle = { width: '100%', padding: 12, cursor: 'pointer', background: '#00e5ff', color: '#000', border: 'none', borderRadius: 10, fontWeight: 'bold' } as const
const secondaryButtonStyle = { marginTop: 10, padding: '7px 10px', cursor: 'pointer', background: '#111', color: 'white', border: '1px solid #333', borderRadius: 8 } as const
const cardStyle = { marginBottom: 20, padding: 20, border: '1px solid #222', borderRadius: 14, background: '#0a0a0a' } as const
const warningStyle = { marginBottom: 10, padding: 12, borderRadius: 10, border: '1px solid #332600', background: '#151000', color: '#ffcc66' } as const
const insightStyle = { marginTop: 10, padding: 12, borderRadius: 10, border: '1px solid #11333a', background: '#061114', color: '#9cf6ff' } as const
const workflowStyle = { padding: 14, borderRadius: 12, border: '1px solid #183b42', background: '#061114', color: '#9cf6ff', lineHeight: 1.6, marginBottom: 12 } as const
const taskStyle = { position: 'relative', padding: 14, marginBottom: 10, border: '1px solid #222', borderRadius: 12, background: '#050505' } as const
const smallDeleteButtonStyle = { position: 'absolute', top: 10, right: 10, background: '#ff3b3b', border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', color: 'white', fontSize: 11 } as const