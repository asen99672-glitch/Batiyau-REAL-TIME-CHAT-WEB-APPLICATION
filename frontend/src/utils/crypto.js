/**
 * Batiyau End-to-End Encryption (E2EE) Engine
 * Implements Elliptic Curve Diffie-Hellman (ECDH P-256) key agreement
 * and AES-GCM-256 symmetric authenticated payload encryption
 * using the standard browser Web Cryptography API (SubtleCrypto).
 */

// In-memory cache for derived AES keys to maximize performance
const keyCache = new Map();

// Convert ArrayBuffer to Base64
export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 to ArrayBuffer
export const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generate a new ECDH P-256 key pair for a user
 */
export const generateUserKeyPair = async () => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
    );

    const publicKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
      publicKeyJWK: JSON.stringify(publicKeyJWK),
      privateKeyJWK: JSON.stringify(privateKeyJWK),
    };
  } catch (error) {
    console.error('Error generating ECDH key pair:', error);
    throw error;
  }
};

/**
 * Retrieve or initialize user's key pair from localStorage
 */
export const getOrInitUserKeys = async (userId) => {
  if (!userId) return null;
  const storageKey = `chatapp_e2ee_keys_${userId}`;

  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      return JSON.parse(existing);
    }

    const newKeys = await generateUserKeyPair();
    localStorage.setItem(storageKey, JSON.stringify(newKeys));
    return newKeys;
  } catch (err) {
    console.error('Error initializing E2EE keys:', err);
    return null;
  }
};

/**
 * Derive AES-GCM-256 shared secret key from private key and recipient's public key
 */
export const deriveSharedAesKey = async (myPrivateKeyJWKStr, recipientPublicKeyJWKStr, pairId) => {
  if (pairId && keyCache.has(pairId)) {
    return keyCache.get(pairId);
  }

  try {
    const myPrivJWK = JSON.parse(myPrivateKeyJWKStr);
    const recipientPubJWK = JSON.parse(recipientPublicKeyJWKStr);

    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      myPrivJWK,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveKey']
    );

    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      recipientPubJWK,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: publicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable for security
      ['encrypt', 'decrypt']
    );

    if (pairId) {
      keyCache.set(pairId, sharedKey);
    }

    return sharedKey;
  } catch (error) {
    console.error('Failed to derive shared AES key:', error);
    return null;
  }
};

/**
 * Encrypt plain text using AES-GCM-256
 */
export const encryptMessageText = async (plainText, aesKey) => {
  if (!plainText || !aesKey) {
    return { ciphertext: plainText, iv: '', isEncrypted: false };
  }

  try {
    // 12-byte IV standard for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      encoded
    );

    return {
      ciphertext: bufferToBase64(ciphertextBuffer),
      iv: bufferToBase64(iv.buffer),
      isEncrypted: true,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return { ciphertext: plainText, iv: '', isEncrypted: false };
  }
};

/**
 * Decrypt ciphertext using AES-GCM-256
 */
export const decryptMessageText = async (ciphertextBase64, ivBase64, aesKey) => {
  if (!ciphertextBase64 || !ivBase64 || !aesKey) {
    return ciphertextBase64;
  }

  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const ivBuffer = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
      },
      aesKey,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    // If decryption fails (e.g., due to E2EE keys changing), show a placeholder instead of the hash.
    return '🔒 This message is unavailable because the security keys have changed.';
  }
};

/**
 * Generate WhatsApp-style 60-digit safety verification number
 * Returns array of 12 blocks of 5 digits: ['12345', '67890', ...]
 */
export const generateWhatsAppSafetyNumber = async (pubKeyAStr = '', pubKeyBStr = '') => {
  try {
    // Sort keys alphabetically so both users generate the exact identical safety code
    const combined = [pubKeyAStr, pubKeyBStr].sort().join('::');
    const encoded = new TextEncoder().encode(combined || 'batiyau_e2ee_default_seed');

    const hashBuffer = await window.crypto.subtle.digest('SHA-512', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert bytes to digits
    let digits = '';
    for (let i = 0; i < hashArray.length; i++) {
      digits += (hashArray[i] % 10).toString();
      if (digits.length >= 60) break;
    }

    while (digits.length < 60) {
      digits += (digits.length % 10).toString();
    }

    // Format into 12 chunks of 5 digits
    const blocks = [];
    for (let i = 0; i < 60; i += 5) {
      blocks.push(digits.substring(i, i + 5));
    }

    return blocks;
  } catch (err) {
    console.error('Error generating safety number:', err);
    // Fallback deterministic 60-digit number
    return [
      '38491', '02847', '58193', '40284',
      '85028', '19472', '84920', '57291',
      '94820', '48201', '59381', '72940'
    ];
  }
};
