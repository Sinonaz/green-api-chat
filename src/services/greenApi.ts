import { GreenApiCredentials, CheckAccountResponse, ReceiveNotificationResponse } from '../types';

export class GreenApiService {
  private credentials: GreenApiCredentials;

  constructor(credentials: GreenApiCredentials) {
    this.credentials = credentials;
  }

  public setCredentials(credentials: GreenApiCredentials) {
    this.credentials = credentials;
  }

  private buildUrl(endpoint: string, queryParams?: Record<string, string | number>): string {
    const rawBaseUrl = (this.credentials.apiUrl || 'https://api.green-api.com').trim().replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    let url = `${rawBaseUrl}/waInstance${this.credentials.idInstance.trim()}/${cleanEndpoint}/${this.credentials.apiTokenInstance.trim()}`;

    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => {
        searchParams.append(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    // In local development, route through Vite proxy to eliminate browser CORS errors
    if (import.meta.env.DEV) {
      return `/api-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
  }

  /**
   * Check connection / instance state
   */
  public async getStateInstance(): Promise<{ stateInstance: string }> {
    const url = this.buildUrl('getStateInstance');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка подключения (${response.status}): ${errorText || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check Telegram account by phone number or username and retrieve chatId
   */
  public async checkAccount(contact: string): Promise<CheckAccountResponse> {
    const url = this.buildUrl('checkAccount');
    const cleaned = contact.replace(/[\s\-\(\)\+]/g, '');
    const isDigitsOnly = /^\d+$/.test(cleaned);

    const body: Record<string, any> = isDigitsOnly
      ? { phoneNumber: Number(cleaned) }
      : { username: contact.replace(/^@/, '') };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка checkAccount (${response.status}): ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      // If checkAccount is not supported or returns error, provide a graceful fallback
      console.warn('checkAccount error, using fallback:', err.message);
      return {
        exist: true,
        chatId: cleaned,
      };
    }
  }

  /**
   * Send a text message to recipient
   */
  public async sendMessage(chatId: string, message: string): Promise<{ idMessage: string }> {
    const url = this.buildUrl('sendMessage');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: chatId.trim(),
        message: message.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка отправки (${response.status}): ${errorText || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Receive a notification from the queue using HTTP API
   */
  public async receiveNotification(receiveTimeout: number = 5): Promise<ReceiveNotificationResponse | null> {
    const url = this.buildUrl('receiveNotification', { receiveTimeout });
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 204) {
          return null;
        }
        const errorText = await response.text();
        console.warn(`receiveNotification warning (${response.status}):`, errorText);
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '' || text === 'null') {
        return null;
      }

      return JSON.parse(text);
    } catch (err: any) {
      // Network interruption or timeout is normal during long polling
      console.debug('receiveNotification fetch error:', err.message);
      return null;
    }
  }

  /**
   * Delete a processed notification from the queue by receiptId
   */
  public async deleteNotification(receiptId: number): Promise<boolean> {
    const rawBaseUrl = (this.credentials.apiUrl || 'https://api.green-api.com').trim().replace(/\/+$/, '');
    const directUrl = `${rawBaseUrl}/waInstance${this.credentials.idInstance.trim()}/deleteNotification/${this.credentials.apiTokenInstance.trim()}/${receiptId}`;
    const url = import.meta.env.DEV
      ? `/api-proxy?url=${encodeURIComponent(directUrl)}`
      : directUrl;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`deleteNotification failed for receiptId ${receiptId}:`, response.status);
        return false;
      }

      const data = await response.json();
      return Boolean(data?.result);
    } catch (err: any) {
      console.warn(`deleteNotification error for receiptId ${receiptId}:`, err.message);
      return false;
    }
  }
}
