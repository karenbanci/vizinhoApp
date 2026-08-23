import logoImg from '../images/logo.png'
import { useLanguage } from '../i18n'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  textClassName?: string
}

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}: LogoProps) {
  const { t } = useLanguage()

  const imgSizes = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-10 h-10 rounded-2xl',
  }

  const textSizes = {
    xs: 'font-semibold text-sm tracking-tight',
    sm: 'font-bold text-base tracking-tight',
    md: 'font-bold text-xl tracking-tight',
    lg: 'font-bold text-2xl tracking-tight',
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={logoImg}
        alt="Vizinho"
        className={`${imgSizes[size]} object-contain shadow-xs shrink-0 transition-transform duration-200 hover:scale-105`}
      />
      {showText && (
        <span
          className={`${textSizes[size]} ${textClassName}`}
          style={{ fontFamily: "'Fraunces', serif", color: '#1A1511' }}
        >
          {t('brand.name')}
        </span>
      )}
    </div>
  )
}
