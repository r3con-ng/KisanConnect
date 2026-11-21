import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import landingPage from './legacy/landing.html?raw';
import loginPage from '../login.html?raw';
import consumerPage from '../consumer.html?raw';
import farmerPage from '../farmer.html?raw';
import adminPage from '../admin.html?raw';
import kycPage from '../kyc.html?raw';
import paymentPage from '../payment.html?raw';
import trackingPage from '../tracking.html?raw';

const pages = {
  '/': { title: 'KisanConnect — Farm Fresh, Direct to You', html: landingPage },
  '/login': { title: 'KisanConnect — Login', html: loginPage, script: 'auth.js', controller: 'Auth' },
  '/consumer': { title: 'KisanConnect — Consumer Marketplace', html: consumerPage, script: 'consumer.js', controller: 'ConsumerApp' },
  '/farmer': { title: 'KisanConnect — Farmer Dashboard', html: farmerPage, script: 'farmer.js', controller: 'Farmer' },
  '/admin': { title: 'KisanConnect — Admin Dashboard', html: adminPage, script: 'admin.js', controller: 'Admin' },
  '/kyc': { title: 'KisanConnect — Farmer Verification', html: kycPage, script: 'kyc.js', controller: 'KYC' },
  '/payment': { title: 'KisanConnect — Payment', html: paymentPage, script: 'payment.js', controller: 'Payment' },
  '/tracking': { title: 'KisanConnect — Order Tracking', html: trackingPage, script: 'tracking.js', controller: 'Tracking' },
};

const scriptLoads = new Map();
function loadLegacyScript(relativePath) {
  if (scriptLoads.has(relativePath)) return scriptLoads.get(relativePath);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}legacy/${relativePath}`;
    script.dataset.kcLegacy = relativePath;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${relativePath}`));
    document.body.appendChild(script);
  });
  scriptLoads.set(relativePath, promise);
  return promise;
}

function legacyHref(value) {
  if (value?.toLowerCase() === 'javascript:history.back()') return '#';
  if (!value || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(value)) return value;
  const match = value.match(/^(?:\.\/)?(index|login|consumer|farmer|admin|kyc|payment|tracking)\.html(\?.*)?$/i);
  if (!match) return value;
  const page = match[1].toLowerCase();
  const route = page === 'index' ? '' : page;
  return `#/${route}${match[2] || ''}`;
}

const svgAttributes = {
  'viewbox': 'viewBox', 'preserveaspectratio': 'preserveAspectRatio', 'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule',
  'clip-rule': 'clipRule', 'fill-opacity': 'fillOpacity', 'stroke-opacity': 'strokeOpacity',
  'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset', 'font-size': 'fontSize',
  'font-family': 'fontFamily', 'text-anchor': 'textAnchor', 'xlink:href': 'xlinkHref',
};
function styleObject(value) {
  const style = {};
  for (const declaration of value.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const key = declaration.slice(0, colon).trim();
    const val = declaration.slice(colon + 1).trim();
    if (!key || !val) continue;
    const reactKey = key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    style[reactKey] = val;
  }
  return style;
}
function inlineHandler(source, name, href) {
  return (event) => {
    if (name === 'onClick' && href === '#') event.preventDefault();
    if (name === 'onSubmit') event.preventDefault();
    try {
      const handler = new Function('event', source);
      const result = handler.call(event.currentTarget, event);
      if (result === false) event.preventDefault();
    } catch (error) {
      console.error('KisanConnect demo action failed:', error);
    }
  };
}
function nodeToReact(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) return null;

  const props = { key };
  const rawHref = node.getAttribute('href');
  for (const attribute of Array.from(node.attributes)) {
    const name = attribute.name;
    const value = attribute.value;
    if (name === 'onclick' || name === 'oninput' || name === 'onchange' || name === 'onsubmit' || name === 'onkeydown' || name === 'onkeyup' || name === 'onfocus' || name === 'onblur') {
      const eventNames = { onclick: 'onClick', oninput: 'onInput', onchange: 'onChange', onsubmit: 'onSubmit', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', onfocus: 'onFocus', onblur: 'onBlur' };
      const reactName = eventNames[name];
      props[reactName] = inlineHandler(value, reactName, rawHref);
      continue;
    }
    if (name === 'class') { props.className = value; continue; }
    if (name === 'for') { props.htmlFor = value; continue; }
    if (name === 'style') { props.style = styleObject(value); continue; }
    if (name === 'href') {
      props.href = legacyHref(value);
      if (value.toLowerCase() === 'javascript:history.back()') props.onClick = () => window.history.back();
      continue;
    }
    if (name === 'value' && ['INPUT', 'TEXTAREA'].includes(node.tagName)) { props.defaultValue = value; continue; }
    if (name === 'checked') { props.defaultChecked = true; continue; }
    if (name === 'selected') { props.defaultSelected = true; continue; }
    if (name === 'autofocus') { props.autoFocus = true; continue; }
    if (name === 'tabindex') { props.tabIndex = Number(value); continue; }
    const mapped = svgAttributes[name] || name;
    if (['disabled', 'hidden', 'multiple', 'required', 'readonly', 'autoplay', 'controls', 'loop', 'muted', 'open', 'novalidate'].includes(name)) {
      props[mapped === 'readonly' ? 'readOnly' : mapped === 'novalidate' ? 'noValidate' : mapped] = true;
    } else {
      props[mapped] = value;
    }
  }

  if (rawHref?.startsWith('#') && !rawHref.startsWith('#/')) {
    const inlineClick = props.onClick;
    props.onClick = (event) => {
      event.preventDefault();
      inlineClick?.(event);
      const target = rawHref.slice(1);
      if (target) requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }));
    };
  }

  const children = Array.from(node.childNodes).map((child, index) => nodeToReact(child, `${key}.${index}`)).filter(child => child !== null);
  return React.createElement(node.tagName.toLowerCase(), props, ...children);
}
function parsePage(html) {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  documentNode.body.querySelectorAll('script, style').forEach(node => node.remove());
  return Array.from(documentNode.body.childNodes).map((node, index) => nodeToReact(node, String(index))).filter(node => node !== null);
}

function LegacyPage({ page }) {
  const reactNodes = useMemo(() => parsePage(page.html), [page.html]);

  useEffect(() => {
    let active = true;
    window.__KC_REACT_RENDERER__ = true;
    const scripts = ['data/translations.js', 'data/demo.js', 'js/app.js'];
    if (page.script) scripts.push(`js/${page.script}`);
    (async () => {
      try {
        for (const script of scripts) await loadLegacyScript(script);
        if (!active) return;
        document.title = page.title;
        window.App.init();
        window.Cart.updateBadge();
        if (page.controller) window[page.controller].init();
        if (page.title.startsWith('KisanConnect — Farm Fresh')) {
          document.querySelectorAll('.counter-animate').forEach((element) => {
            const target = Number(element.dataset.target || 0);
            if (target) window.animateCounter(element, target);
          });
        }
      } catch (error) {
        console.error(error);
      }
    })();
    return () => { active = false; };
  }, [page]);

  return <div className="react-legacy-root min-h-screen" data-app-renderer="react">{reactNodes}</div>;
}

export default function App() {
  const location = useLocation();
  const page = pages[location.pathname] || pages['/'];
  return <LegacyPage key={location.pathname} page={page} />;
}
