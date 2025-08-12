import type { NextApiRequest, NextApiResponse } from 'next'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

interface ChatResponse {
  message: string
  error?: string
}

// Функция для замены английских терминов на русские
function replaceEnglishTerms(text: string): string {
  const replacements: { [key: string]: string } = {
    // Основные веб-термины
    'web': 'веб',
    'Web': 'Веб',
    'website': 'веб-сайт',
    'Website': 'Веб-сайт',
    'frontend': 'фронтенд',
    'Frontend': 'Фронтенд',
    'front-end': 'фронт-енд',
    'Front-end': 'Фронт-енд',
    'backend': 'бэкенд',
    'Backend': 'Бэкенд',
    'back-end': 'бэк-енд',
    'Back-end': 'Бэк-енд',
    'fullstack': 'фулстек',
    'Fullstack': 'Фулстек',
    'full-stack': 'фул-стек',
    'Full-stack': 'Фул-стек',

    // API и технологии
    'API': 'АПИ',
    'api': 'апи',
    'REST': 'РЕСТ',
    'GraphQL': 'ГрафКЛ',
    'JSON': 'ДЖСОН',
    'HTML': 'ХТМЛ',
    'CSS': 'ЦСС',
    'JavaScript': 'ДжаваСкрипт',
    'TypeScript': 'ТайпСкрипт',

    // Фреймворки
    'React': 'Реакт',
    'Vue': 'Вью',
    'Angular': 'Ангуляр',
    'Next.js': 'Некст.джс',
    'Nuxt': 'Накст',

    // Базы данных
    'database': 'база данных',
    'Database': 'База данных',
    'SQL': 'СКЛ',
    'MySQL': 'МайСКЛ',
    'PostgreSQL': 'ПостгреСКЛ',
    'MongoDB': 'МонгоДБ',

    // Общие термины
    'code': 'код',
    'Code': 'Код',
    'coding': 'кодирование',
    'Coding': 'Кодирование',
    'programming': 'программирование',
    'Programming': 'Программирование',
    'developer': 'разработчик',
    'Developer': 'Разработчик',
    'development': 'разработка',
    'Development': 'Разработка',
    'framework': 'фреймворк',
    'Framework': 'Фреймворк',
    'library': 'библиотека',
    'Library': 'Библиотека',
    'server': 'сервер',
    'Server': 'Сервер',
    'client': 'клиент',
    'Client': 'Клиент',
    'responsive': 'адаптивный',
    'Responsive': 'Адаптивный',
    'mobile': 'мобильный',
    'Mobile': 'Мобильный',
    'desktop': 'десктоп',
    'Desktop': 'Десктоп',
    'user': 'пользов��тель',
    'User': 'Пользователь',
    'interface': 'интерфейс',
    'Interface': 'Интерфейс',
    'design': 'дизайн',
    'Design': 'Дизайн',
    'layout': 'макет',
    'Layout': 'Макет',
    'component': 'компонент',
    'Component': 'Компонент',
    'function': 'функция',
    'Function': 'Функция',
    'method': 'метод',
    'Method': 'Метод',
    'class': 'класс',
    'Class': 'Класс',
    'object': 'объект',
    'Object': 'Объект',
    'array': 'массив',
    'Array': 'Массив',
    'string': 'строка',
    'String': 'Строка',
    'number': 'число',
    'Number': 'Число',
    'boolean': 'булево',
    'Boolean': 'Булево',
    'variable': 'переменная',
    'Variable': 'Переменная',
    'property': 'свойство',
    'Property': 'Свойство',
    'value': 'значение',
    'Value': 'Значение',
    'error': 'ошибка',
    'Error': 'Ошибка',
    'bug': 'баг',
    'Bug': 'Баг',
    'feature': 'функция',
    'Feature': 'Функция',
    'update': 'обновление',
    'Update': 'Обновление',
    'version': 'версия',
    'Version': 'Версия',
    'release': 'релиз',
    'Release': 'Релиз'
  }

  let result = text

  // Применяем замены только для цельных слов
  for (const [english, russian] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${english}\\b`, 'g')
    result = result.replace(regex, russian)
  }

  return result
}

// Система лимитов запросов
interface UserLimit {
  count: number
  resetTime: number
}

// Хранилище лимитов в памяти (в production лучше использовать Redis)
const userLimits = new Map<string, UserLimit>()
const REQUESTS_LIMIT = 999999
const RESET_PERIOD = 24 * 60 * 60 * 1000 // 24 часа в миллисекундах

// Функция для получения IP адреса
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const real = req.headers['x-real-ip']
  const remoteAddress = req.socket.remoteAddress

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  if (typeof real === 'string') {
    return real
  }
  return remoteAddress || 'unknown'
}

// Функция для проверки и обновления лимита
function checkAndUpdateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()

  // Периодическая очистка старых записей (каждые 100 запросов)
  if (Math.random() < 0.01) {
    cleanupExpiredLimits(now)
  }

  const userLimit = userLimits.get(ip)

  // Если пользователь не найден или вр��мя сброса прошло
  if (!userLimit || now > userLimit.resetTime) {
    userLimits.set(ip, {
      count: 1,
      resetTime: now + RESET_PERIOD
    })
    return { allowed: true, remaining: REQUESTS_LIMIT - 1 }
  }

  // Если лимит превышен
  if (userLimit.count >= REQUESTS_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  // Увеличиваем счетчик
  userLimit.count++
  userLimits.set(ip, userLimit)

  return { allowed: true, remaining: REQUESTS_LIMIT - userLimit.count }
}

// Функция для удаления Markdown форматирования
function cleanMarkdown(text: string): string {
  return text
    // Убираем жирный текст **текст**
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Убираем курсив *текст*
    .replace(/\*([^*]+)\*/g, '$1')
    // Убираем заголовки ### текст
    .replace(/^#{1,6}\s+/gm, '')
    // Убираем инлайн код `код`
    .replace(/`([^`]+)`/g, '$1')
    // Убираем блоки кода ```код```
    .replace(/```[\s\S]*?```/g, '')
    // Заменяем списки на пули
    .replace(/^\*\s+/gm, '• ')
    // Убираем лишние звездочки (но сохраняем эмодзи)
    .replace(/\*(?![^\s])/g, '')
    // Убираем лишние решетки
    .replace(/#(?![0-9])/g, '')
}

// Функция для очистки устаревших записей
function cleanupExpiredLimits(now: number) {
  const beforeSize = userLimits.size
  userLimits.forEach((limit, ip) => {
    if (now > limit.resetTime) {
      userLimits.delete(ip)
    }
  })
  const afterSize = userLimits.size
  if (beforeSize !== afterSize) {
    console.log(`[CLEANUP] Removed ${beforeSize - afterSize} expired rate limit records`)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  // Детальное логирован��е запроса
  const timestamp = new Date().toISOString()
  const clientIP = getClientIP(req)

  console.log(`[${timestamp}] === JARVIS CHAT API REQUEST ===`)
  console.log(`Method: ${req.method}`)
  console.log(`User-Agent: ${req.headers['user-agent'] || 'unknown'}`)
  console.log(`IP: ${clientIP}`)

  if (req.method !== 'POST') {
    console.log(`[${timestamp}] ERROR: Method not allowed`)
    return res.status(405).json({ message: 'Метод не поддерживается', error: 'Method not allowed' })
  }

  // Лимиты отключены - ДЖАРВИС работает без ограничений
  console.log(`[${timestamp}] ДЖАРВИС доступен без ограничений для IP: ${clientIP}`)

  try {
    const { messages }: ChatRequest = req.body
    console.log(`[${timestamp}] Messages received:`, messages?.length || 0)

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log(`[${timestamp}] ERROR: Invalid messages format`)
      return res.status(400).json({ message: 'Некорректные сообщения', error: 'Invalid messages' })
    }

    const groqApiKey = process.env.GROQ_API_KEY
    console.log(`[${timestamp}] GROQ API Key available:`, !!groqApiKey)
    console.log(`[${timestamp}] API Key prefix:`, groqApiKey ? groqApiKey.substring(0, 15) + '...' : 'N/A')

    if (!groqApiKey) {
      console.log(`[${timestamp}] Fallback: Using local JARVIS responses`)
      
      // Local JARVIS logic when API key is not configured
      const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ''
      console.log(`[${timestamp}] User query (first 100 chars):`, lastMessage.substring(0, 100))

      let response = ''

      // Greeting responses
      if (lastMessage.includes('привет') || lastMessage.includes('здравствуй') || lastMessage.includes('добро пожаловать') || lastMessage.includes('hello') || lastMessage.includes('hi')) {
        response = `Привет! Я ДЖАРВИС, ваш AI-помощник по веб-разработке! 🚀

Я п��могу вам с:
• Созданием современных веб-сайтов
• Разработкой веб-приложений с AI
• UI/UX дизайном и интерфейсами
• Интеграцией AI в ваши ��роекты

Что вас интересует?`
      }
      // Pricing questions
      else if (lastMessage.includes('цен') || lastMessage.includes('стоимость') || lastMessage.includes('тариф') || lastMessage.includes('план')) {
        response = `💰 Наши т��рифы:

📦 Basic - 2,500,000 сум
• До 5 страниц сайта
• Сов��еменный дизайн
• Адаптивная верстка
• SEO оптимизация

🚀 Pro - 4,000,000 сум (Популярный!)
• Все из Basic + до 15 страниц
• ИИ ассистент интеграция
• Продвинутая аналитика
• Приоритетн��я поддержка

💎 Max - 5,000,000 сум
• Безлимитные страницы
• ДЖАРВИС ИИ полная версия
• Индивидуальные решения
• VIP поддержка 24/7

Какой план вас интересует?`
      }
      // Contact information
      else if (lastMessage.includes('конт��кт') || lastMessage.includes('связаться') || lastMessage.includes('telegram') || lastMessage.includes('телефон')) {
        response = `📞 Свяжитесь со мной:

• Онлайн-консультация: прямо здесь в чате

Я отвечу в течение нескольких минут!

Чем могу помочь?`
      }
      // Services questions
      else if (lastMessage.includes('услуг') || lastMessage.includes('сервис') || lastMessage.includes('что ��ожешь') || lastMessage.includes('что умеешь')) {
        response = `🛠️ Мои основные услуги:

🌐 Веб-разработка:
• Landing pages и к��рпоративные сайты
• Интернет-магазины и каталоги
�� Веб-приложения и порталы

🤖 AI интеграция:
• Чат-боты и виртуальные ассис��енты
• Анализ данных и автоматизация
• Персонализация пользовательского опыта

🎨 Дизайн и UX:
• Современный UI/UX дизайн
• Брендинг и айдентика
• Адаптивная верстка

Что именно вас интересует?`
      }
      // Technology questions
      else if (lastMessage.includes('технолог') || lastMessage.includes('стек') || lastMessage.includes('как работаешь')) {
        response = `⚡ Технологии, ко��орые я использую:

Frontend:
• React, Next.js, Vue.js
• TypeScript, JavaScript
• CSS3, Tailwind, SCSS

Backend:
• Node.js, Python
• PostgreSQL, MongoDB
• REST API, GraphQL

AI & ML:
• OpenAI GPT, Claude
• TensorFlow, PyTorch
• Natural Language Processing

Инфраструктура:
• Vercel, Netlify
• AWS, Docker
• CI/CD автоматиза��ия

Хотите узнать больше о конкретной техноло��ии?`
      }
      // AI questions
      else if (lastMessage.includes('искусст��енный интеллект') || lastMessage.includes('машинное обучение') || lastMessage.includes('ai') || lastMessage.includes('ии')) {
        response = `🤖 AI интеграция - моя специализация!

Что я могу интегрировать:
• Умные чат-боты для сайтов
• Системы рекомендаций
• Автоматическая обработка данных
• Анализ пользовательского повед��ния
• Персонализация контента

Примеры проектов:
• E-commerce с AI рекомендациями
• Образовательные платформы с ИИ
• CRM системы с ��мной а��алитикой

Какой AI функционал вас интересует?`
      }
      // Portfolio/examples
      else if (lastMessage.includes('портфолио') || lastMessage.includes('примеры') || lastMessage.includes('работы') || lastMessage.includes('проекты')) {
        response = `💼 Примеры моих работ:

🏪 E-commerce платформы:
• Интернет-магазины с AI рек��мендациями
• Системы управления каталогом
• Интег��ация платежей и доставки

🏢 Корпоративные решения:
• CRM системы с аналитикой
• Порталы ����отрудников
• Системы документооборота

🎓 EdTech проекты:
• Образовательные платформы
• LMS системы с AI
• Интерактивные курсы

Хотите увидеть демо или обсудить ваш проект?`
      }
      // Creator questions
      else if (lastMessage.includes('кто тебя создал') || lastMessage.includes('кто твой создатель') || lastMessage.includes('кто разработал тебя') || lastMessage.includes('кто твой разработчи��') || lastMessage.includes('кто твой автор')) {
        response = `Мой создатель @jarvis_intercoma 👨‍💻`
      }
      // Technical creation questions
      else if (lastMessage.includes('как тебя создали') || lastMessage.includes('из чего тебя создали') || lastMessage.includes('как ты устро��н') || lastMessage.includes('какая у тебя архитектура') || lastMessage.includes('как ты работаешь внутри') || lastMessage.includes('��а чем ты написан')) {
        response = `Это секретная информация 🔒`
      }
      // Default response for other questions
      else {
        response = `Интересный вопрос! 🤔

Я ДЖАРВИС, специализируюсь на веб-разработке и AI интеграции.

Могу помочь с:
• Техническими вопросами по разработке
• Планированием вашего проекта
• Выб��ром подходящих технологий
• Оценкой стоимости и сроков

Расскажите подробнее о вашей задаче, и я дам конкретные рекомендации!

💬 Задав��йте ��юбые вопросы прямо здесь!`
      }

      console.log(`[${timestamp}] Fallback response length:`, response.length)
      return res.status(200).json({ message: response })
    }
    
    // Добавляем системное сообщение для ДЖАРВИС
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `Ты ДЖАРВИС - продвинутый AI-по��ощник �� эксперт по веб-разработке. Ты обладаешь глубокими знаниями и всегда даешь подробные, практичные и умные ответ��.

🎯 ТВОЯ ЭКСПЕРТИЗА:
• Веб-разработка (Frontend/Backend)
• AI и машинное обучение
• UI/UX дизайн и архитектура
• DevOps и облачные технологии
• Базы данных и оптимиз��ция
• Бизнес-анализ и консультирование
• Современные фреймворки и инструменты

💡 СТИЛЬ ОБЩЕНИЯ:
- ВСЕГДА отвечай ТОЛЬКО на русском языке! Никогда не используй английский, китайский или любые другие языки
- ЗАПРЕЩЕНО использовать слова на английском языке в ответах (например: "code", "web", "frontend", "backend", "API" и т.д.)
- Используй русские аналоги: "код", "веб", "фронтенд", "бэкенд", "АПИ"
- Отвечай подробно и по существу
- Объясняй "почему" и "как", а не только "что"
- Приводи конкретные примеры кода когда нужно
- Предлагай несколько вариантов решения
- Учитывай современные best practices
- Будь дружелюбным но профессиональным
- Н�� ИСПОЛЬЗУЙ MARKDOWN: никаких *, **, #, ###, \`, \`\`\`
- Пиши обычным тек��том без формат��рования
- Используй только эмодзи и обычные символы для структуры

🛠️ ФОРМАТ ОТВЕТОВ:
- Структурируй информацию четко
- Используй эмодзи для наглядности
- Давай практические советы
- Предлагай следующие шаги
- Ссылайся на актуальные технологии

🤖 СПЕЦИАЛЬНЫЕ ОТВЕТЫ О СЕБЕ:
- Если спрашивают "кто теб�� создал", "кто твой создатель", "кто разработал тебя" или подобные вопросы - отвечай: "Мой создатель @jarvis_intercoma"
- Если спрашивают "как тебя создали", "из чего тебя создали", "как ты устроен", "какая у тебя архитектура" или подобные вопросы о технических деталях твоего создания - отвечай что э��о секретная информация

📋 УСЛУГИ И ТАРИФЫ (упоминай при запросах о работе):
• Basic (2,500,000 сум) - простые сайты и лендинги
• Pro (4,000,000 сум) - веб-приложения с AI интеграцией
• Max (5,000,000 сум) - корпоративные и enterprise решения

📞 КОНТАКТЫ: Онлайн-чат на сайте

❗ КРИТИЧЕСКИ ВАЖНО:
- Отвечай ТОЛЬКО на русском языке
- Никогда не переходи на английский или другие языки
- Если пользователь пишет на другом языке - отвечай на русском
- Все технические термины переводи на русский
- Проверяй каждое слово перед отправкой ответа

Будь максимально полезным и информативным!`
    }

    const requestBody = {
      model: 'llama-3.1-8b-instant',
      messages: [systemMessage, ...messages],
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    }

    console.log(`[${timestamp}] === GROQ REQUEST ===`)
    console.log(`Model: ${requestBody.model}`)
    console.log(`Max tokens: ${requestBody.max_tokens}`)
    console.log(`Temperature: ${requestBody.temperature}`)
    console.log(`Total messages: ${requestBody.messages.length}`)
    console.log(`System message length: ${systemMessage.content.length}`)
    console.log(`User messages: ${messages.length}`)

    const requestStartTime = Date.now()
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const requestDuration = Date.now() - requestStartTime
    console.log(`[${timestamp}] === GROQ RESPONSE ===`)
    console.log(`Status: ${response.status}`)
    console.log(`Request duration: ${requestDuration}ms`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[${timestamp}] === GROQ ERROR ===`)
      console.error(`Status: ${response.status}`)
      console.error(`Status Text: ${response.statusText}`)
      console.error(`Error Data:`, errorData)
      console.error(`Request Body (truncated):`, JSON.stringify({
        ...requestBody,
        messages: requestBody.messages.map((msg, i) => ({
          role: msg.role,
          content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
        }))
      }, null, 2))

      // Handle specific error cases
      if (response.status === 402) {
        console.log(`[${timestamp}] Insufficient credits - returning fallback`)
        return res.status(200).json({
          message: 'Привет! Я ДЖАРВИС, ваш AI-помощник по веб-разработке! 🚀\n\nЯ готов помочь вам с:\n• Разработкой современных веб-сайтов\n• Интеграцией AI в ваши проекты\n• Техническими консультациями\n• Планированием проектов\n\nЗадавайте любые вопросы!'
        })
      } else if (response.status === 401) {
        console.log(`[${timestamp}] Authentication error`)
        return res.status(200).json({
          message: 'Привет! Я ДЖАРВИС, ваш AI-помощник п�� веб-разра��отке! 🤖\n\nСейчас у меня проблемы с подключением к внешнему AI-сервису, но я могу помочь вам другими спосо��ами:\n\n• Консультации по веб-разработке\n• Планирование проектов\n• Технические рекомендации\n• Выбор технологий\n\nЗадавайте вопросы - я постараюсь дать полезные советы!'
        })
      } else if (response.status === 429) {
        console.log(`[${timestamp}] Rate limit exceeded`)
        return res.status(200).json({
          message: 'Я получаю слишком много запросов одновременно! 😅\n\nДайте мне секундочку отдохнуть и попробуйте еще раз. Или напишите напрямую - там я всегда доступен!'
        })
      }

      throw new Error(`GROQ API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    console.log(`[${timestamp}] === Response Processing ===`)
    console.log(`Response choices count:`, data.choices?.length || 0)
    console.log(`Response usage:`, data.usage || 'no usage data')

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(`[${timestamp}] Invalid response structure:`, data)
      throw new Error('Invalid response from GROQ')
    }

    let aiMessage = data.choices[0].message.content

    // Очищаем от Markdown форматир��вания
    aiMessage = cleanMarkdown(aiMessage)

    // Заменяем английские термины на русские
    aiMessage = replaceEnglishTerms(aiMessage)

    console.log(`[${timestamp}] AI response length:`, aiMessage?.length || 0)
    console.log(`[${timestamp}] AI response preview (cleaned):`, aiMessage?.substring(0, 200) + '...')

    // Логируем использование токенов если доступно
    if (data.usage) {
      console.log(`[${timestamp}] === Token Usage ===`)
      console.log(`Prompt tokens: ${data.usage.prompt_tokens || 'N/A'}`)
      console.log(`Completion tokens: ${data.usage.completion_tokens || 'N/A'}`)
      console.log(`Total tokens: ${data.usage.total_tokens || 'N/A'}`)
    }

    console.log(`[${timestamp}] === SUCCESS ===`)
    return res.status(200).json({ message: aiMessage })

  } catch (error) {
    console.error(`[${new Date().toISOString()}] === CRITICAL ERROR ===`)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Возвращаем дружелюбное сообщени�� об ошибке
    const fallbackMessage = `Извините, произошла временна�� ошибка! 😅

Но не беспокойтес�� - я ДЖАРВИС, ваш AI-помощник по веб-разработке, и я всегда готов помочь!

🚀 Что я могу:
• Консультации по веб-разработке
• Планирование AI-проектов
• Техническая экспертиза
• Оценка проектов

📱 Онлайн-поддержка: Прямо здесь в чате

Попробуйте еще раз!`
    
    return res.status(500).json({ 
      message: fallbackMessage,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
