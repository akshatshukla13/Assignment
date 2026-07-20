/**
 * ProductImage
 * Renders a product image (base64) or a styled placeholder
 * that maintains the same aspect ratio and visual weight.
 *
 * Props:
 *   imageBase64  – base64 string from DB (may be null)
 *   name         – product name (used in placeholder)
 *   category     – product category (used in placeholder sub-text)
 *   className    – extra classes for the wrapper div
 *   rounded      – border-radius class, default 'rounded-lg'
 */

const CATEGORY_GRADIENTS = {
  Grains:    ['#f59e0b', '#d97706'],
  Oils:      ['#84cc16', '#4d7c0f'],
  Pulses:    ['#f97316', '#c2410c'],
  Sugar:     ['#ec4899', '#9d174d'],
  Spices:    ['#ef4444', '#991b1b'],
  Beverages: ['#8b5cf6', '#5b21b6'],
  Dairy:     ['#06b6d4', '#0e7490'],
  Snacks:    ['#f59e0b', '#b45309'],
  default:   ['#6366f1', '#4338ca'],
};

function getGradient(category) {
  return CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.default;
}

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

export default function ProductImage({
  imageBase64,
  name = '',
  category = '',
  className = '',
  rounded = 'rounded-lg',
}) {
  const [from, to] = getGradient(category);
  const initials = getInitials(name);

  const wrapperClass = `relative overflow-hidden ${rounded} ${className}`;

  if (imageBase64) {
    return (
      <div className={wrapperClass} style={{ aspectRatio: '4/3' }}>
        <img
          src={imageBase64}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Stylised placeholder — same 4:3 aspect ratio
  return (
    <div
      className={wrapperClass}
      style={{
        aspectRatio: '4/3',
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.15,
      }}>
        <div style={{
          position: 'absolute', top: '-30%', right: '-20%',
          width: '70%', paddingBottom: '70%',
          borderRadius: '50%', background: 'white',
        }} />
        <div style={{
          position: 'absolute', bottom: '-25%', left: '-15%',
          width: '55%', paddingBottom: '55%',
          borderRadius: '50%', background: 'white',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        color: 'white',
      }}>
        <span style={{
          fontSize: 'clamp(1.2rem, 4cqw, 2.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          textShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}>
          {initials || '?'}
        </span>
        <span style={{
          fontSize: 'clamp(0.55rem, 2cqw, 0.7rem)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          opacity: 0.85,
        }}>
          {category || 'No Image'}
        </span>
      </div>
    </div>
  );
}
