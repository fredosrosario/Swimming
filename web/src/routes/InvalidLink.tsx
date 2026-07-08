import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HomeIcon, LockIcon } from '../components/icons'

export default function InvalidLink() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
        <LockIcon className="h-8 w-8" />
      </span>
      <h1 className="text-lg font-bold text-slate-800">{t('invalid.title')}</h1>
      <p className="text-slate-500">{t('invalid.body')}</p>
      <Link to="/" className="btn-secondary mt-2">
        <HomeIcon className="h-5 w-5" />
        {t('common.backHome')}
      </Link>
    </div>
  )
}
