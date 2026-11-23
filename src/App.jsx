import { useEffect, useRef, useState } from 'react'
import './App.css'

const welcomeMessage = {
  role: 'assistant',
  content: "Hey, I'm your FITAI coach. Tell me what you're working toward and we'll make a plan that fits your life. To personalize it, share your age, height, weight, goal, and any dietary preferences.",
}
const currentYear = new Date().getFullYear()

const suggestions = [
  'Build me a beginner workout plan',
  'Create a high-protein Indian meal plan',
  'How do I lose fat sustainably?',
]

const features = [
  {
    number: '01',
    title: 'Made for your body',
    description: 'Training that adapts to your experience, goals, schedule, and the equipment you have.',
    icon: '↗',
  },
  {
    number: '02',
    title: 'Eat well, your way',
    description: 'Practical Indian meals with familiar ingredients, flexible swaps, and no crash diets.',
    icon: '✳',
  },
  {
    number: '03',
    title: 'A coach in your corner',
    description: 'Ask questions, get unstuck, and adjust your routine whenever real life gets busy.',
    icon: '◎',
  },
]

const workouts = [
  {
    tag: 'STRENGTH · 4 DAYS / WEEK',
    title: 'Build your base',
    level: 'Beginner friendly',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85',
    alt: 'Athlete strength training with a barbell',
  },
  {
    tag: 'CONDITIONING · 3 DAYS / WEEK',
    title: 'Find your pace',
    level: 'All levels',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
    alt: 'Modern gym with strength training equipment',
  },
  {
    tag: 'MOBILITY · 20 MIN / DAY',
    title: 'Move with ease',
    level: 'Everyday reset',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=85',
    alt: 'Athlete stretching before a workout',
  },
]

const nutrition = [
  { name: 'Paneer power bowl', detail: 'Paneer · brown rice · greens', protein: '32g protein' },
  { name: 'Masala egg bhurji', detail: 'Eggs · roti · fresh herbs', protein: '26g protein' },
  { name: 'Moong dal chilla', detail: 'Moong dal · curd · chutney', protein: '22g protein' },
]

function Logo({ light = false }) {
  return (
    <a className={`brand${light ? ' brand-light' : ''}`} href="#home" aria-label="FITAI home">
      <span className="brand-mark" aria-hidden="true">F</span>
      <span>FIT<span className="brand-accent">AI</span></span>
    </a>
  )
}

function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = window.localStorage.getItem('fitai-chat-history')
      const parsed = saved ? JSON.parse(saved) : null
      return Array.isArray(parsed) && parsed.length ? parsed : [welcomeMessage]
    } catch {
      return [welcomeMessage]
    }
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const messageEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    window.localStorage.setItem('fitai-chat-history', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending, isOpen])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  async function sendMessage(value = input) {
    const text = value.trim()
    if (!text || isSending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setIsSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-24) }),
      })
      const responseBody = await response.text()
      let data = null
      try {
        data = responseBody ? JSON.parse(responseBody) : null
      } catch {
        throw new Error(`The coach returned an unreadable response (${response.status}). Check that the backend is running, then try again.`)
      }
      if (!response.ok) throw new Error(data?.error || `The coach could not respond (${response.status}). Please try again.`)
      if (!data || typeof data !== 'object') {
        throw new Error('The coach returned an empty response. Please try again.')
      }
      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('The coach returned an empty response. Please try again.')
      }
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }])
    } catch (requestError) {
      setError(requestError.message || 'Unable to reach your coach. Check your connection and try again.')
    } finally {
      setIsSending(false)
    }
  }

  function clearConversation() {
    setMessages([welcomeMessage])
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage()
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#approach">Why FITAI</a>
            <a href="#training">Training</a>
            <a href="#nutrition">Nutrition</a>
          </nav>
          <button className="header-cta" onClick={() => setIsOpen(true)}>
            Meet your coach <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-image" role="img" aria-label="Athlete training in a dark, modern gym" />
          <div className="hero-shade" />
          <div className="hero-content page-width">
            <div className="eyebrow"><span className="pulse-dot" /> YOUR TRAINING. YOUR TERMS.</div>
            <h1>YOUR PERSONAL<br />AI FITNESS <span>COACH.</span></h1>
            <p className="hero-copy">
              A smarter way to get stronger. Training that fits your life, and nutrition that feels like home.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => setIsOpen(true)}>
                Build my plan <span aria-hidden="true">↗</span>
              </button>
              <a className="text-link" href="#approach">Explore the FITAI approach <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true"><i>R</i><i>A</i><i>S</i></div>
              <span>Made for real people, not perfect routines.</span>
            </div>
          </div>
          <div className="hero-index"><span>01</span> / TRAIN SMARTER</div>
          <a className="scroll-cue" href="#approach">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
        </section>

        <section className="intro-section section-pad" id="approach">
          <div className="page-width">
            <div className="section-topline"><span>01 — A BETTER KIND OF COACH</span><span>FITNESS THAT FITS REAL LIFE</span></div>
            <div className="intro-grid">
              <h2>Progress isn’t one-size-fits-all<span>.</span></h2>
              <div className="intro-copy">
                <p>So your coaching shouldn’t be either. FITAI pairs thoughtful AI coaching with a grounded approach to movement and food—built around you, wherever you’re starting from.</p>
                <a className="text-link" href="#coach">Get to know your coach <span aria-hidden="true">↗</span></a>
              </div>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.number}>
                  <div className="feature-card-top"><span>{feature.number} / 03</span><span className="feature-icon">{feature.icon}</span></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="workout-section section-pad" id="training">
          <div className="page-width">
            <div className="section-topline"><span>02 — YOUR NEXT REP</span><span>SHOW UP. WE’LL TAKE IT FROM THERE.</span></div>
            <div className="section-heading-row">
              <h2>Find your kind<br />of <span>strong.</span></h2>
              <div className="section-side-copy"><p>Simple starting points. Your coach will shape a program around your goal, experience, and equipment.</p><button className="text-link button-as-link" onClick={() => setIsOpen(true)}>Make it personal <span aria-hidden="true">↗</span></button></div>
            </div>
            <div className="workout-grid">
              {workouts.map((workout, index) => (
                <article className="workout-card" key={workout.title}>
                  <div className="workout-photo" style={{ backgroundImage: `url("${workout.image}")` }}>
                    <span className="workout-count">0{index + 1}</span>
                    <span className="workout-level">{workout.level}</span>
                  </div>
                  <div className="workout-info"><span>{workout.tag}</span><h3>{workout.title}</h3><button aria-label={`Ask your coach about ${workout.title}`} onClick={() => { setIsOpen(true); setInput(`Help me get started with ${workout.title.toLowerCase()}.`) }}>↗</button></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="nutrition-section section-pad" id="nutrition">
          <div className="page-width nutrition-layout">
            <div className="nutrition-copy">
              <div className="section-topline"><span>03 — GOOD FOOD, NO GUESSWORK</span></div>
              <h2>Rooted in home.<br />Built for <span>your goals.</span></h2>
              <p>Familiar Indian ingredients, thoughtfully balanced. Your plan can work with your preferences, your kitchen, and your everyday routine.</p>
              <button className="button button-light" onClick={() => setIsOpen(true)}>Get a meal plan <span aria-hidden="true">↗</span></button>
              <div className="nutrition-note"><span className="nutrition-note-icon">✳</span><span>Vegetarian, vegan, high-protein, or your own way. Your preferences lead.</span></div>
            </div>
            <div className="meal-board">
              <div className="meal-board-heading"><span>A TASTE OF WHAT’S POSSIBLE</span><span>GOOD FOOD, YOUR WAY</span></div>
              {nutrition.map((meal, index) => (
                <article className="meal-row" key={meal.name}>
                  <span className="meal-number">0{index + 1}</span>
                  <div className="meal-details"><h3>{meal.name}</h3><p>{meal.detail}</p></div>
                  <span className="meal-protein">{meal.protein}</span>
                </article>
              ))}
              <div className="meal-board-foot"><span>IDEAS, NOT RULES.</span><span>LET’S FIND YOUR BALANCE ↗</span></div>
            </div>
          </div>
        </section>

        <section className="coach-section section-pad" id="coach">
          <div className="page-width coach-layout">
            <div>
              <div className="section-topline"><span>04 — YOUR AI COACH</span><span>HERE WHEN YOU NEED IT</span></div>
              <div className="coach-copy">
                <div className="coach-orbit"><span>F</span><i /><i /><i /></div>
                <p className="coach-kicker">A LITTLE LESS FIGURING IT OUT.</p>
                <h2>Good questions.<br /><span>Better momentum.</span></h2>
                <p className="coach-description">Tell your coach what you’re aiming for. Share your age, height, weight, goal, and food preferences for guidance that feels more like yours.</p>
                <button className="button button-primary" onClick={() => setIsOpen(true)}>Start a conversation <span aria-hidden="true">↗</span></button>
              </div>
            </div>
            <div className="coach-preview">
              <div className="preview-top"><span className="preview-status"><i /> FITAI COACH</span><span>AVAILABLE 24/7</span></div>
              <div className="preview-message coach-message">Hey! What would you like to work on today?</div>
              <div className="preview-message user-message">I want to get stronger and eat better.</div>
              <div className="preview-message coach-message">Love that. What does your week look like right now?</div>
              <div className="preview-bottom"><span>YOUR COACH, JUST A MESSAGE AWAY</span><span>↗</span></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width">
          <div className="footer-main">
            <div><Logo light /><p>Stronger, in your own way.</p></div>
            <div className="footer-links"><a href="#approach">The approach</a><a href="#training">Training</a><a href="#nutrition">Nutrition</a><button onClick={() => setIsOpen(true)}>Talk to your coach ↗</button></div>
          </div>
          <div className="footer-bottom"><span>© {currentYear} FITAI. MADE FOR YOUR NEXT REP.</span><span>CONSISTENCY OVER PERFECTION. ALWAYS.</span></div>
        </div>
      </footer>

      {isOpen && (
        <section className="chat-panel" aria-label="FITAI AI coach chat">
          <div className="chat-header">
            <div className="chat-brand"><span className="chat-brand-mark">F</span><div><strong>FITAI COACH</strong><span><i /> READY WHEN YOU ARE</span></div></div>
            <div className="chat-controls">
              <button className="chat-clear" onClick={clearConversation} disabled={isSending} aria-label="Clear conversation" title="Clear conversation">↻</button>
              <button className="chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
            </div>
          </div>
          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role === 'user' ? 'chat-user' : 'chat-assistant'}`} key={`${index}-${message.role}`}>
                {message.role === 'assistant' && <span className="message-mark">F</span>}
                <p>{message.content}</p>
              </div>
            ))}
            {messages.length === 1 && <div className="suggestion-list">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} disabled={isSending}>{suggestion} <span>↗</span></button>)}</div>}
            {isSending && <div className="chat-message chat-assistant"><span className="message-mark">F</span><div className="typing-indicator" aria-label="Coach is typing"><i /><i /><i /></div></div>}
            {error && <div className="chat-error" role="alert">{error}</div>}
            <div ref={messageEndRef} />
          </div>
          <form className="chat-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="coach-message-input">Message your coach</label>
            <textarea id="coach-message-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event) } }} placeholder="Ask your coach anything..." rows="1" disabled={isSending} />
            <button type="submit" disabled={!input.trim() || isSending} aria-label="Send message">↑</button>
            <span className="chat-input-hint">ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</span>
          </form>
        </section>
      )}
      {!isOpen && <button className="chat-launcher" onClick={() => setIsOpen(true)} aria-label="Open FITAI coach chat"><span className="launcher-mark">F</span><span className="launcher-copy">TALK TO YOUR COACH</span><span className="launcher-arrow">↗</span></button>}
    </>
  )
}

export default App
