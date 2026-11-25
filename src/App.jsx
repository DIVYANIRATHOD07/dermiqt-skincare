import React, { useEffect, useRef, useState } from 'react';
import products from './products.js';
import AuthPage from './Auth.jsx';

const imageUrl = (id, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price);

function getProductIdFromLocation() {
  const match = window.location.hash.match(/^#product\/([^/?#]+)$/);
  return match && products.some((product) => product.id === match[1]) ? match[1] : null;
}

function getAuthViewFromLocation() {
  const match = window.location.hash.match(/^#(login|register|forgot-password|account)$/);
  if (!match) return null;
  return match[1] === 'forgot-password' ? 'forgot' : match[1];
}

function readDemoAuth() {
  try {
    const user = JSON.parse(window.localStorage.getItem('dermiqt-demo-user') || 'null');
    const storedSession = window.localStorage.getItem('dermiqt-demo-session');
    const session = JSON.parse(storedSession || window.sessionStorage.getItem('dermiqt-demo-session') || 'null');
    if (!user || !session || typeof user.email !== 'string' || user.email !== session.email) return null;
    return { name: user.name, email: user.email, mobile: user.mobile || '' };
  } catch {
    console.error('Unable to restore the saved demo account state.');
    return null;
  }
}

async function hashDemoPassword(password, salt) {
  if (!window.crypto?.subtle) throw new Error('Secure browser hashing is unavailable in this browser.');
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function handleProductImageError(event, fallbackImage) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) {
    image.hidden = true;
    console.error(`Unable to load product image or its fallback: ${image.currentSrc}`);
    return;
  }
  image.dataset.fallbackApplied = 'true';
  image.src = fallbackImage;
}

const shopMenuColumns = [
  {
    id: 'concerns',
    title: 'Shop by concern',
    groups: [{
      items: ['Acne', 'Pigmentation', 'Dryness', 'UV Damage', 'Underarm Darkness', 'Oiliness', 'Dullness', 'Aging']
        .map((value) => ({ label: value, filter: { field: 'concerns', value } })),
    }],
  },
  {
    id: 'ingredients',
    title: 'Shop by ingredients',
    groups: [
      {
        items: ['Vitamin C', 'BHA / Salicylic Acid', 'Retinoid / Retinol', 'Niacinamide', 'UV Filters', 'Ceramide']
          .map((value) => ({ label: value, filter: { field: 'ingredients', value } })),
      },
      {
        title: 'Body care',
        items: ['Cleanse', 'Roll On', 'Lotion']
          .map((value) => ({ label: value, resultLabel: `Body Care — ${value}`, filter: { field: 'bodyCare', value } })),
      },
    ],
  },
  {
    id: 'routines',
    title: 'Skin care',
    groups: [
      {
        items: ['Cleanse', 'Tone', 'Treat', 'Moisturize', 'SPF', 'Under Eye']
          .map((value) => ({ label: value, resultLabel: `Skin Care — ${value}`, filter: { field: 'skinCare', value } })),
      },
      {
        title: 'Lip',
        items: ['Treat', 'Protect']
          .map((value) => ({ label: value, resultLabel: `Lip — ${value}`, filter: { field: 'lip', value } })),
      },
    ],
  },
];

function ArrowIcon({ diagonal = false }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      {diagonal ? (
        <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.3" />
      ) : (
        <path d="M2.5 10h14m-5.5-5.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.3" />
      )}
    </svg>
  );
}

function BrandMark() {
  return (
    <a className="brand-mark" href="#home" aria-label="DERMIQT home">
      DERMIQT<span className="brand-period">.</span>
    </a>
  );
}

function MegaMenu({ onSelectFilter }) {
  return (
    <div className="mega-menu" id="shop-mega-menu">
      <button
        className="mega-menu-all"
        type="button"
        onClick={() => onSelectFilter({ field: 'all', value: 'all', label: 'All Products' })}
      >
        Discover all products <ArrowIcon />
      </button>
      <div className="mega-menu-inner">
        {shopMenuColumns.map((column) => (
          <details className="mega-menu-column" key={column.id} open>
            <summary>{column.title}</summary>
            <div className="mega-menu-column-content">
              {column.groups.map((group) => (
                <section className="mega-menu-group" key={group.title || column.id}>
                  {group.title && <h3>{group.title}</h3>}
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <button type="button" onClick={() => onSelectFilter({ ...item.filter, label: item.resultLabel || item.label })}>
                          {item.label}<span aria-hidden="true">↗</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </details>
        ))}
      </div>
      <p className="mega-menu-note">Thoughtful care for every kind of skin.</p>
    </div>
  );
}

function Header({ bagCount, onBagOpen, onSelectFilter, authUser, onAuthOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const shopButtonRef = useRef(null);
  const closeMenu = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        shopButtonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  function chooseFilter(filter) {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    onSelectFilter(filter);
  }

  return (
    <header className={`site-header ${menuOpen ? 'shop-menu-open' : ''}`} ref={headerRef}>
      <a className="header-note" href="#story">Skincare, thoughtfully considered</a>
      <button
        className={`menu-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileMenuOpen}
        onClick={() => {
          setMobileMenuOpen(!mobileMenuOpen);
          setMenuOpen(false);
        }}
      >
        <span /><span />
      </button>
      <BrandMark />
      <nav className={`main-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
        <a href="#home" onClick={closeMenu}>Home</a>
        <button
          ref={shopButtonRef}
          className={`nav-shop-button ${menuOpen ? 'is-active' : ''}`}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="shop-mega-menu"
          onMouseEnter={() => setMenuOpen(true)}
          onClick={() => {
            if (window.matchMedia('(max-width: 640px)').matches) setMobileMenuOpen(true);
            setMenuOpen(true);
          }}
        >
          Shop <span aria-hidden="true">⌄</span>
        </button>
        <a href="#story" onClick={closeMenu}>Our Story</a>
        <a href="#journal" onClick={closeMenu}>Journal</a>
      </nav>
      {menuOpen && <MegaMenu onSelectFilter={chooseFilter} />}
      <div className="header-actions">
        <button className="account-button" onClick={onAuthOpen} aria-label={authUser ? `Open account for ${authUser.name}` : 'Log in or create an account'}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5.5 20c.4-3.5 2.8-5.5 6.5-5.5s6.1 2 6.5 5.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>{authUser ? 'Account' : 'Login'}</span>
        </button>
        <button className="bag-button" onClick={onBagOpen} aria-label={`Open shopping bag, ${bagCount} items`}>
          <span className="bag-label">Bag</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M5.5 8h13l1.2 12h-15L5.5 8Z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="bag-count">{bagCount}</span>
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <p className="eyebrow hero-eyebrow"><span /> Skincare, considered</p>
        <h1>Care Beyond<br /><em>Boundaries.</em></h1>
        <p className="hero-copy">Intelligent formulations, grounded in nature.<br className="desktop-break" /> A quieter kind of care, created for the skin you’re in.</p>
        <a className="button button-dark" href="#shop">Discover the collection <ArrowIcon /></a>
        <div className="hero-signature"><span>01</span><i /> Thoughtful care, without compromise</div>
      </div>
      <div className="hero-visual">
        <img
          className="hero-image"
          src={imageUrl('photo-1524504388940-b1c1722653e1', 1800)}
          alt="An elegant beauty campaign portrait with naturally luminous skin"
        />
        <div className="hero-image-shade" />
        <div className="hero-caption">The beauty of being <em>well in your skin.</em></div>
        <div className="hero-image-index">DERMIQT <span>—</span> CAMPAIGN 01</div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, copy, link }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {copy && <p className="heading-copy">{copy}</p>}
      {link && <a className="text-link" href={link.href}>{link.label}<ArrowIcon /></a>}
    </div>
  );
}

function ProductCard({ product, onAdd, onOpenProduct, onQuickView, isWishlisted, onToggleWishlist }) {
  return (
    <article className="product-card">
      <div className="product-image-area">
        <a
          className="product-image-wrap"
          href={`#product/${product.id}`}
          aria-label={`View ${product.name} product details`}
          onClick={(event) => {
            event.preventDefault();
            onOpenProduct(product);
          }}
        >
          <img
            src={product.image}
            alt={product.alt}
            loading="lazy"
            onError={(event) => handleProductImageError(event, product.fallbackImage)}
          />
          {product.badge && <span className="product-label">{product.badge}</span>}
        </a>
        <button
          className="product-quick-view"
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Quick view ${product.name}`}
        >
          Quick view <ArrowIcon diagonal />
        </button>
        <button
          className={`wishlist-button ${isWishlisted ? 'is-wishlisted' : ''}`}
          type="button"
          aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist: ${product.name}`}
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist(product.id)}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
      </div>
      <div className="product-info">
        <div>
          <h3><a href={`#product/${product.id}`} onClick={(event) => {
            event.preventDefault();
            onOpenProduct(product);
          }}>{product.name}</a></h3>
          <p>{product.detail}</p>
          <p className="product-rating" aria-label={`Rated ${product.rating} out of 5`}>★ {product.rating} <span>·</span> {product.size}</p>
        </div>
        <span className="product-price">{formatPrice(product.price)}</span>
      </div>
      <button className="add-button" onClick={() => onAdd(product)}>Add to bag <span>+</span></button>
    </article>
  );
}

function Bestsellers({ onAdd, onOpenProduct, onQuickView, selectedFilter, onClearFilters, wishlist, onToggleWishlist }) {
  const [category, setCategory] = useState('All Products');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const categories = ['All Products', 'Skin Care', 'Body Care', 'Lip'];
  useEffect(() => {
    setCategory('All Products');
    setSearch('');
    setSort('featured');
  }, [selectedFilter]);

  function clearAllFilters() {
    setCategory('All Products');
    setSearch('');
    setSort('featured');
    onClearFilters();
  }

  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'All Products' || product.categories.includes(category);
    const term = search.trim().toLowerCase();
    const metadata = [
      ...product.concerns,
      ...product.ingredients,
      ...product.bodyCare,
      ...product.skinCare,
      ...product.lip,
      ...product.aliases,
      ...product.productTypes,
    ].join(' ');
    const matchesSearch = !term || `${product.name} ${product.detail} ${product.description} ${product.category} ${metadata}`.toLowerCase().includes(term);
    const matchesSelectedFilter = !selectedFilter || selectedFilter.field === 'all' || product[selectedFilter.field]?.includes(selectedFilter.value);
    return matchesCategory && matchesSearch && matchesSelectedFilter;
  }).sort((first, second) => {
    if (sort === 'price-low') return first.price - second.price;
    if (sort === 'price-high') return second.price - first.price;
    if (sort === 'newest') return second.launched.localeCompare(first.launched);
    return 0;
  });
  const hasActiveFilters = Boolean(selectedFilter || category !== 'All Products' || search.trim());
  const filterDescription = selectedFilter
    ? selectedFilter.label
    : category !== 'All Products'
      ? category
      : `Search: ${search.trim()}`;

  return (
    <section className="bestsellers section-pad" id="shop">
      <nav className="shop-breadcrumb" aria-label="Breadcrumb">
        <a href="#home">Home</a><span aria-hidden="true">/</span><span>Shop</span>
        {selectedFilter && <><span aria-hidden="true">/</span><strong>{selectedFilter.label}</strong></>}
      </nav>
      <SectionHeading
        eyebrow="The considered edit"
        title={selectedFilter ? <>Shop <em>{selectedFilter.label}</em></> : category !== 'All Products' ? <>Shop <em>{category}</em></> : <>Your skin, <em>in good hands.</em></>}
        copy="Thoughtful formulations for every step of your skincare ritual."
      />
      {hasActiveFilters && (
        <div className="active-filter">
          <span>{selectedFilter ? 'Showing:' : category !== 'All Products' ? 'Category:' : search.trim() ? 'Search:' : ''} <strong>{filterDescription}</strong></span>
          <button type="button" onClick={clearAllFilters}>Clear all filters <span aria-hidden="true">×</span></button>
        </div>
      )}
      <div className="collection-tools">
        <div className="category-filters" aria-label="Filter products by category">
          {categories.map((item) => (
            <button key={item} className={category === item ? 'is-selected' : ''} onClick={() => setCategory(item)} aria-pressed={category === item}>
              {item}
            </button>
          ))}
        </div>
        <label className="sort-select">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <label className="product-search">
          <span className="sr-only">Search products</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="8.7" cy="8.7" r="5.7" stroke="currentColor" strokeWidth="1.2" /><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.2" /></svg>
          <input type="search" placeholder="Search the collection" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>
      <p className="shop-product-count" aria-live="polite">{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</p>
      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAdd}
            onOpenProduct={onOpenProduct}
            onQuickView={onQuickView}
            isWishlisted={wishlist.includes(product.id)}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
        {visibleProducts.length === 0 && (
          <div className="no-products">
            <p>No products are currently tagged for <strong>{selectedFilter?.label || search || category}</strong>.</p>
            <span>Clear the filters to browse all of our considered essentials.</span>
            <button type="button" onClick={clearAllFilters}>Clear all filters</button>
          </div>
        )}
      </div>
      <p className="product-footnote">Showing {visibleProducts.length} of {products.length} considered essentials <span>·</span> Complimentary delivery over ₹5,000</p>
    </section>
  );
}

function ProductDetail({
  product,
  onAdd,
  onOpenProduct,
  onQuickView,
  onContinueShopping,
  wishlist,
  onToggleWishlist,
}) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.gallery[0] || product.image);
  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);
  const skinTypeCopy = product.skinTypeSuitability.length
    ? product.skinTypeSuitability.join(', ')
    : 'Skin-type suitability is not specified in this demo catalogue.';

  return (
    <div className="product-detail-page">
      <nav className="shop-breadcrumb product-detail-breadcrumb" aria-label="Breadcrumb">
        <a href="#home" onClick={(event) => {
          event.preventDefault();
          onContinueShopping();
        }}>Home</a>
        <span aria-hidden="true">/</span>
        <a href="#shop" onClick={(event) => {
          event.preventDefault();
          onContinueShopping();
        }}>Shop</a>
        <span aria-hidden="true">/</span>
        <a href="#shop" onClick={(event) => {
          event.preventDefault();
          onContinueShopping();
        }}>{product.category}</a>
        <span aria-hidden="true">/</span>
        <strong>{product.name}</strong>
      </nav>

      <div className="product-detail-layout">
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img
              src={activeImage}
              alt={product.alt}
              onError={(event) => handleProductImageError(event, product.fallbackImage)}
            />
            {product.badge && <span className="product-label">{product.badge}</span>}
          </div>
          <div className="product-gallery-thumbnails" aria-label="Product image gallery">
            {product.gallery.map((image, index) => (
              <button
                className={`product-gallery-thumbnail ${activeImage === image ? 'is-selected' : ''}`}
                type="button"
                key={`${product.id}-image-${index}`}
                aria-label={`View ${product.name} image ${index + 1}`}
                aria-pressed={activeImage === image}
                onClick={() => setActiveImage(image)}
              >
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  onError={(event) => handleProductImageError(event, product.fallbackImage)}
                />
              </button>
            ))}
            <span className="product-gallery-count">{product.gallery.length} {product.gallery.length === 1 ? 'image' : 'images'}</span>
          </div>
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">{product.category}{product.productTypes.length ? ` · ${product.productTypes[0]}` : ''}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-intro">{product.detail}</p>
          <p className="product-detail-rating" aria-label={`Demo rating ${product.rating} out of 5`}>
            <span aria-hidden="true">★</span> {product.rating}
            <span>·</span> {product.reviewCount} demo reviews
          </p>
          <p className="product-detail-demo-note">Demo rating and review count — not actual customer reviews.</p>
          <p className="product-detail-price">{formatPrice(product.price)} <span>· {product.size}</span></p>
          <p className="product-detail-description">{product.description}</p>

          <div className="product-detail-actions">
            <div className="product-detail-quantity" aria-label={`Quantity for ${product.name}`}>
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
              >−</button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => current + 1)}
              >+</button>
            </div>
            <button className="checkout-button product-detail-add" type="button" onClick={() => onAdd(product, quantity)}>
              Add to bag <span>{formatPrice(product.price * quantity)}</span>
            </button>
            <button
              className={`product-detail-wishlist ${wishlist.includes(product.id) ? 'is-wishlisted' : ''}`}
              type="button"
              aria-pressed={wishlist.includes(product.id)}
              onClick={() => onToggleWishlist(product.id)}
            >
              {wishlist.includes(product.id) ? '♥ Saved to wishlist' : '♡ Add to wishlist'}
            </button>
          </div>

          <div className="product-detail-information">
            <section>
              <h2>Key benefits</h2>
              <ul>{product.keyBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
            </section>
            <section>
              <h2>Ingredients</h2>
              {product.ingredients.length
                ? <ul>{product.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
                : <p>Ingredient details are not specified in this demo catalogue.</p>}
            </section>
            <section>
              <h2>How to use</h2>
              <p>{product.howToUse}</p>
            </section>
            <section>
              <h2>Skin type suitability</h2>
              <p>{skinTypeCopy}</p>
              <small>Suitability is suggested from the product concern tags; review the full formulation before use.</small>
            </section>
          </div>
          <a className="continue-shopping-link" href="#shop" onClick={(event) => {
            event.preventDefault();
            onContinueShopping();
          }}>Continue shopping <ArrowIcon /></a>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="product-related section-pad">
          <SectionHeading
            eyebrow={`More from ${product.category}`}
            title={<>You may also <em>like.</em></>}
            copy="Explore more considered essentials from this collection."
          />
          <div className="product-grid">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                onAdd={onAdd}
                onOpenProduct={onOpenProduct}
                onQuickView={onQuickView}
                isWishlisted={wishlist.includes(relatedProduct.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Philosophy() {
  return (
    <section className="philosophy" id="story">
      <div className="philosophy-image">
        <img src={imageUrl('photo-1608571423902-eed4a5ad8108', 1300)} alt="Botanical skincare ingredients and glass bottles" loading="lazy" />
        <span className="image-note">Nature, with intention.</span>
      </div>
      <div className="philosophy-copy">
        <p className="eyebrow">Our point of view</p>
        <h2>Skin is personal.<br /><em>Care should be, too.</em></h2>
        <p>We believe the best skincare begins with listening. To your skin, to science, and to the world our ingredients come from.</p>
        <p>Every DERMIQT formula is made with purpose: considered actives, conscious sourcing, and room for your skin to simply be itself.</p>
        <a className="text-link" href="#journal">The DERMIQT philosophy <ArrowIcon /></a>
        <div className="philosophy-stamp"><span>Made with care</span><strong>D</strong><span>For every skin</span></div>
      </div>
    </section>
  );
}

function IngredientStrip() {
  return (
    <section className="ingredient-strip">
      <p className="eyebrow">Good things, thoughtfully chosen</p>
      <div className="ingredient-list">
        <span>Barrier-loving ceramides</span><i>✳</i>
        <span>Botanical squalane</span><i>✳</i>
        <span>Clinically considered</span><i>✳</i>
        <span>Always cruelty-free</span>
      </div>
    </section>
  );
}

function Rituals() {
  return (
    <section className="rituals section-pad">
      <SectionHeading
        eyebrow="Make a moment of it"
        title={<>A ritual for <em>every rhythm.</em></>}
        copy="Simple steps. A little more presence. Meet your skin where it is, morning to night."
      />
      <div className="ritual-grid">
        <a href="#shop" className="ritual-card morning-card">
          <img src={imageUrl('photo-1608248543803-ba4f8c70ae0b', 1200)} alt="Morning skincare arranged in sunlight" loading="lazy" />
          <span className="ritual-number">01 — 03</span>
          <div className="ritual-overlay">
            <p className="eyebrow">The morning ritual</p>
            <h3>Begin gently.<br /><em>Meet the day.</em></h3>
            <span className="ritual-link">Explore the ritual <ArrowIcon /></span>
          </div>
        </a>
        <a href="#shop" className="ritual-card evening-card">
          <img src={imageUrl('photo-1611930022073-b7a4ba5fcccd', 1200)} alt="Evening skincare in a calm, warm interior" loading="lazy" />
          <span className="ritual-number">04 — 06</span>
          <div className="ritual-overlay">
            <p className="eyebrow">The evening ritual</p>
            <h3>Let the day go.<br /><em>Come back to you.</em></h3>
            <span className="ritual-link">Explore the ritual <ArrowIcon /></span>
          </div>
        </a>
      </div>
    </section>
  );
}

function Campaign() {
  return (
    <section className="campaign" id="journal">
      <img src={imageUrl('photo-1611930022073-b7a4ba5fcccd', 2000)} alt="A quiet, sunlit skincare moment" loading="lazy" />
      <div className="campaign-content">
        <p className="eyebrow">A note on doing less</p>
        <h2>Less noise.<br /><em>More you.</em></h2>
        <a className="button button-light" href="#story">Read our journal <ArrowIcon /></a>
      </div>
      <span className="campaign-side-note">THE ART OF A QUIETER ROUTINE — VOL. 01</span>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="testimonial section-pad">
      <p className="eyebrow">Kind words, real skin</p>
      <div className="quote-mark">“</div>
      <blockquote>“My routine finally feels like something I do for myself — not something I have to get right.”</blockquote>
      <div className="quote-author"><span className="quote-line" /> ALEX R. <span className="quote-dot">·</span> VERIFIED CUSTOMER</div>
      <div className="testimonial-controls"><span className="active-dot" /><span /><span /><small>01 / 03</small></div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <section className="newsletter">
      <div className="newsletter-copy">
        <p className="eyebrow">A little note from us</p>
        <h2>Good skin days,<br /><em>delivered.</em></h2>
        <p>Thoughtful reads, first access, and 10% off your first order.</p>
      </div>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <label htmlFor="newsletter-email">Your email address</label>
        <div className="email-field">
          <input id="newsletter-email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={submitted} />
          <button type="submit" aria-label="Subscribe to newsletter" disabled={submitted}><ArrowIcon /></button>
        </div>
        <p className="newsletter-message" aria-live="polite">
          {submitted ? 'You’re on the list. Look out for a little something from us.' : 'By subscribing, you agree to receive our occasional notes. Unsubscribe anytime.'}
        </p>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <BrandMark />
          <p>Care that meets you<br />where you are.</p>
          <div className="social-links"><a href="#instagram">Instagram</a><a href="#pinterest">Pinterest</a></div>
        </div>
        <div className="footer-column"><p className="eyebrow">Explore</p><a href="#shop">Shop all</a><a href="#story">Our story</a><a href="#journal">Journal</a></div>
        <div className="footer-column"><p className="eyebrow">Here to help</p><a href="#contact">Contact us</a><a href="#shipping">Shipping & returns</a><a href="#faq">FAQs</a></div>
        <div className="footer-column"><p className="eyebrow">The details</p><a href="#ingredients">Ingredients</a><a href="#sustainability">Our impact</a><a href="#privacy">Privacy</a></div>
      </div>
      <div className="footer-bottom"><span>© 2025 DERMIQT SKINCARE</span><span>MADE WITH CARE, EVERYWHERE.</span><a href="#top">BACK TO TOP ↑</a></div>
    </footer>
  );
}

function QuickView({ product, onClose, onAdd }) {
  if (!product) return null;

  return (
    <div className="quick-view-layer">
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close product details" />
      <section className="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <button className="drawer-close quick-view-close" onClick={onClose} aria-label="Close product details">×</button>
        <img
          src={product.image}
          alt={product.alt}
          onError={(event) => handleProductImageError(event, product.fallbackImage)}
        />
        <div className="quick-view-copy">
          <p className="eyebrow">{product.category}</p>
          <h2 id="quick-view-title">{product.name}</h2>
          <p className="quick-view-detail">{product.detail}</p>
          <p className="quick-view-description">{product.description}</p>
          <p className="quick-view-meta">★ {product.rating} <span>·</span> {product.size}</p>
          <p className="quick-view-price">{formatPrice(product.price)}</p>
          <button className="checkout-button" onClick={() => onAdd(product)}>Add to bag <span>+</span></button>
        </div>
      </section>
    </div>
  );
}

function BagDrawer({ bag, onClose, onRemove, onQuantityChange }) {
  const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close shopping bag" />
      <aside className="bag-drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
        <div className="drawer-header">
          <div><p className="eyebrow">Your considered edit</p><h2 id="bag-title">Your bag <span>({bag.reduce((sum, item) => sum + item.quantity, 0)})</span></h2></div>
          <button className="drawer-close" onClick={onClose} aria-label="Close shopping bag">×</button>
        </div>
        {bag.length === 0 ? (
          <div className="bag-empty"><p>Your bag is taking a quiet moment.</p><button className="text-link" onClick={onClose}>Explore the collection <ArrowIcon /></button></div>
        ) : (
          <>
            <div className="bag-items">
              {bag.map((item) => (
                <article className="bag-item" key={item.name}>
                  <img
                    src={item.image}
                    alt={item.alt}
                    onError={(event) => handleProductImageError(event, item.fallbackImage)}
                  />
                  <div className="bag-item-info">
                    <h3>{item.name}</h3>
                    <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                      <button onClick={() => onQuantityChange(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onQuantityChange(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                    </div>
                    <button onClick={() => onRemove(item.id)}>Remove</button>
                  </div>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </article>
              ))}
            </div>
            <div className="bag-summary"><p><span>Subtotal</span><strong>{formatPrice(total)}</strong></p><small>Shipping and taxes calculated at checkout.</small><button className="checkout-button" onClick={() => window.alert('Thank you for exploring DERMIQT. Checkout is not enabled in this frontend demo.')}>Continue to checkout <ArrowIcon /></button></div>
          </>
        )}
      </aside>
    </>
  );
}

export default function App() {
  const [activeProductId, setActiveProductId] = useState(getProductIdFromLocation);
  const [activeAuthView, setActiveAuthView] = useState(getAuthViewFromLocation);
  const [authUser, setAuthUser] = useState(readDemoAuth);
  const [authNotice, setAuthNotice] = useState('');
  const [bag, setBag] = useState(() => {
    try {
      const savedBag = JSON.parse(window.localStorage.getItem('dermiqt-bag') || '[]');
      if (!Array.isArray(savedBag)) throw new Error('Saved bag data is not a list.');
      return savedBag.flatMap((item) => {
        if (!item || typeof item.name !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1) return [];
        const product = products.find((entry) => entry.id === item.id || entry.name === item.name);
        return product ? [{ ...product, quantity: item.quantity }] : [];
      });
    } catch (error) {
      console.error('Unable to restore the saved shopping bag.', error);
      return [];
    }
  });
  const [bagOpen, setBagOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = JSON.parse(window.localStorage.getItem('dermiqt-wishlist') || '[]');
      if (!Array.isArray(savedWishlist)) throw new Error('Saved wishlist data is not a list.');
      return savedWishlist.filter((id) => typeof id === 'string' && products.some((product) => product.id === id));
    } catch (error) {
      console.error('Unable to restore the saved wishlist.', error);
      return [];
    }
  });
  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    function syncProductRoute() {
      setActiveProductId(getProductIdFromLocation());
      setActiveAuthView(getAuthViewFromLocation());
      setQuickViewProduct(null);
      setAuthNotice('');
    }

    window.addEventListener('popstate', syncProductRoute);
    window.addEventListener('hashchange', syncProductRoute);
    return () => {
      window.removeEventListener('popstate', syncProductRoute);
      window.removeEventListener('hashchange', syncProductRoute);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setBagOpen(false);
        setQuickViewProduct(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function openProduct(product) {
    setQuickViewProduct(null);
    setActiveProductId(product.id);
    setActiveAuthView(null);
    window.history.pushState(null, '', `#product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueShopping() {
    setQuickViewProduct(null);
    setActiveProductId(null);
    setActiveAuthView(null);
    window.history.pushState(null, '', '#shop');
    window.requestAnimationFrame(() => {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function selectShopFilter(filter) {
    setActiveProductId(null);
    setActiveAuthView(null);
    setSelectedFilter(filter);
    window.history.replaceState(null, '', '#shop');
    window.requestAnimationFrame(() => {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  useEffect(() => {
    try {
      window.localStorage.setItem('dermiqt-bag', JSON.stringify(bag));
    } catch (error) {
      console.error('Unable to save the shopping bag.', error);
    }
  }, [bag]);

  useEffect(() => {
    try {
      window.localStorage.setItem('dermiqt-wishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Unable to save the wishlist.', error);
    }
  }, [wishlist]);

  function addToBag(product, quantity = 1) {
    setBag((currentBag) => {
      const existing = currentBag.find((item) => item.id === product.id);
      return existing
        ? currentBag.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...currentBag, { ...product, quantity }];
    });
    setBagOpen(true);
  }

  function removeFromBag(id) {
    setBag((currentBag) => currentBag.filter((item) => item.id !== id));
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) {
      removeFromBag(id);
      return;
    }
    setBag((currentBag) => currentBag.map((item) => item.id === id ? { ...item, quantity } : item));
  }

  function toggleWishlist(id) {
    setWishlist((currentWishlist) => currentWishlist.includes(id)
      ? currentWishlist.filter((productId) => productId !== id)
      : [...currentWishlist, id]);
  }

  function navigateAuth(view, notice = '') {
    setQuickViewProduct(null);
    setActiveProductId(null);
    setAuthNotice(notice);
    const hash = view === 'forgot' ? '#forgot-password' : view === 'home' ? '#home' : `#${view}`;
    window.history.pushState(null, '', hash);
    setActiveAuthView(view === 'home' ? null : view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function registerDemoUser({ name, email, mobile, password }) {
    try {
      const current = JSON.parse(window.localStorage.getItem('dermiqt-demo-user') || 'null');
      if (current?.email === email) return { success: false, message: 'An account already exists for this email. Please log in.' };
      const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
      const salt = Array.from(saltBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      const passwordHash = await hashDemoPassword(password, salt);
      const user = { name, email, mobile, salt, passwordHash };
      window.localStorage.setItem('dermiqt-demo-user', JSON.stringify(user));
      window.localStorage.setItem('dermiqt-demo-session', JSON.stringify({ email }));
      window.sessionStorage.removeItem('dermiqt-demo-session');
      setAuthUser({ name, email, mobile });
      navigateAuth('account', 'Your demo account is ready. Welcome to DERMIQT.');
      return { success: true };
    } catch {
      return { success: false, message: 'We could not save your demo account in this browser. Please try again.' };
    }
  }

  async function loginDemoUser({ email, password, remember }) {
    try {
      const user = JSON.parse(window.localStorage.getItem('dermiqt-demo-user') || 'null');
      if (!user || user.email !== email) return { success: false, message: 'Email or password is incorrect.' };
      const passwordHash = await hashDemoPassword(password, user.salt);
      if (passwordHash !== user.passwordHash) return { success: false, message: 'Email or password is incorrect.' };
      const session = JSON.stringify({ email: user.email });
      if (remember) {
        window.localStorage.setItem('dermiqt-demo-session', session);
        window.sessionStorage.removeItem('dermiqt-demo-session');
      } else {
        window.sessionStorage.setItem('dermiqt-demo-session', session);
        window.localStorage.removeItem('dermiqt-demo-session');
      }
      setAuthUser({ name: user.name, email: user.email, mobile: user.mobile || '' });
      navigateAuth('account', 'You’re signed in to your DERMIQT demo account.');
      return { success: true };
    } catch {
      return { success: false, message: 'We could not verify your demo account in this browser. Please try again.' };
    }
  }

  function forgotDemoPassword(email) {
    if (!email) return Promise.resolve({ success: false, message: 'Enter a valid email address.' });
    return Promise.resolve({
      success: true,
      message: 'If an account exists for this email, reset instructions would be sent. This demo does not send email or change passwords.',
    });
  }

  function logoutDemoUser() {
    window.localStorage.removeItem('dermiqt-demo-session');
    window.sessionStorage.removeItem('dermiqt-demo-session');
    setAuthUser(null);
    navigateAuth('login', 'You have logged out of your DERMIQT demo account.');
  }

  return (
    <>
      <div className="announcement">Complimentary shipping on orders over ₹5,000 <span>·</span> A little care, on us</div>
      <Header
        bagCount={bagCount}
        onBagOpen={() => setBagOpen(true)}
        onSelectFilter={selectShopFilter}
        authUser={authUser}
        onAuthOpen={() => navigateAuth(authUser ? 'account' : 'login')}
      />
      <main>
        {activeAuthView ? (
          <AuthPage
            view={activeAuthView === 'account' && !authUser ? 'login' : activeAuthView}
            user={authUser}
            notice={authNotice}
            onNavigate={navigateAuth}
            onLogin={loginDemoUser}
            onRegister={registerDemoUser}
            onForgotPassword={forgotDemoPassword}
            onLogout={logoutDemoUser}
          />
        ) : activeProductId ? (
          <ProductDetail
            key={activeProductId}
            product={products.find((product) => product.id === activeProductId)}
            onAdd={addToBag}
            onOpenProduct={openProduct}
            onQuickView={setQuickViewProduct}
            onContinueShopping={continueShopping}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
          />
        ) : (
          <>
            <Hero />
            <Bestsellers
              onAdd={addToBag}
              onOpenProduct={openProduct}
              onQuickView={setQuickViewProduct}
              selectedFilter={selectedFilter}
              onClearFilters={() => setSelectedFilter(null)}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
            />
            <Philosophy />
            <IngredientStrip />
            <Rituals />
            <Campaign />
            <Testimonial />
            <Newsletter />
          </>
        )}
      </main>
      <Footer />
      {quickViewProduct && (
        <QuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAdd={(product) => {
            addToBag(product);
            setQuickViewProduct(null);
          }}
        />
      )}
      {bagOpen && <BagDrawer bag={bag} onClose={() => setBagOpen(false)} onRemove={removeFromBag} onQuantityChange={updateQuantity} />}
    </>
  );
}
