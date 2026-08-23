import { useState } from 'react'
import { CATEGORIES, CATEGORY_STYLE, type Provider } from '../data'
import { countryName, flagUrl } from '../countries'

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProviderCard({
  provider,
  onOpen,
}: {
  provider: Provider
  onOpen: (p: Provider) => void
}) {
  const [liked, setLiked] = useState(false)
  const style = CATEGORY_STYLE[provider.category]
  const cat = CATEGORIES.find((c) => c.id === provider.category)

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
      onClick={() => onOpen(provider)}
    >
      <div className="relative">
        <img
          src={`https://images.unsplash.com/${provider.photoId}?w=480&h=320&fit=crop&auto=format&q=80`}
          alt={`Foto de ${provider.name}`}
          className="w-full h-52 object-cover bg-gray-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          aria-label={liked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <svg
            className={`w-4 h-4 transition-colors ${liked ? 'text-red-500' : 'text-gray-500'}`}
            fill={liked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {provider.badge && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-800">
            ★ {provider.badge}
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.pill}`}>
            {cat?.emoji} {provider.categoryLabel}
          </span>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 flex items-center gap-1.5"
            title={countryName(provider.nationality)}
          >
            <img
              src={flagUrl(provider.nationality)}
              alt={`Bandeira de ${countryName(provider.nationality)}`}
              className="w-4 h-4 rounded-sm object-cover ring-1 ring-black/5"
              loading="lazy"
            />
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{provider.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-gray-500">{provider.location}</span>
              {provider.nationality && (
                <span className="text-xs text-gray-400">· {countryName(provider.nationality)}</span>
              )}
            </div>
          </div>
          {provider.verified && (
            <div className="flex items-center gap-0.5 text-teal-600 flex-shrink-0 ml-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Verificada</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 my-2">
          <StarRating rating={provider.rating} />
          <span className="text-sm font-bold text-gray-800">{provider.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({provider.reviews})</span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{provider.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-base font-bold text-gray-900">{provider.price}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${provider.availableNow ? 'bg-green-400' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">{provider.availability}</span>
            </div>
          </div>
          <button
            className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#E8553D' }}
            onClick={(e) => { e.stopPropagation(); onOpen(provider) }}
          >
            Ver Perfil
          </button>
        </div>
      </div>
    </div>
  )
}
