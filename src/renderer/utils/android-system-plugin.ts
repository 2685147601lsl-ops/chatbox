export interface AndroidSystemPlugin {
  /**
   * Request necessary Android permissions
   */
  requestPermissions(): Promise<{ granted: boolean }>;

  /**
   * Check if necessary Android permissions are granted
   */
  checkPermissions(): Promise<{ granted: boolean }>;

  /**
   * Open an application by its package name
   */
  openApp(options: { packageName: string }): Promise<{ success: boolean; message?: string }>;

  /**
   * Simulate a click at specific coordinates or on text
   */
  simulateClick(options: { text?: string; x?: number; y?: number }): Promise<{ success: boolean; message?: string }>;

  /**
   * Input text into the currently focused field
   */
  inputText(options: { text: string }): Promise<{ success: boolean; message?: string }>;

  /**
   * Take a screenshot and return base64
   */
  screenshot(): Promise<{ base64: string; message?: string }>;

  /**
   * Read the latest SMS messages
   */
  readSms(options: { count: number }): Promise<{ messages: { body: string; datetime: string; address: string }[]; message?: string }>;

  /**
   * Send an SMS
   */
  sendSms(options: { phoneNumber: string; message: string }): Promise<{ success: boolean; message?: string }>;

  /**
   * Read active notifications
   */
  readNotifications(): Promise<{ notifications: { title: string; text: string; packageName: string }[]; message?: string }>;

  /**
   * Get device location
   */
  getLocation(): Promise<{ latitude: number; longitude: number; message?: string }>;

  /**
   * List installed apps (launchable)
   */
  listApps(): Promise<{ apps: { name: string; packageName: string }[]; message?: string }>;
}
