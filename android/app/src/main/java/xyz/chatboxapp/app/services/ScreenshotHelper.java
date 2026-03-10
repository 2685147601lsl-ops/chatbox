package xyz.chatboxapp.app.services;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.WindowManager;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

public class ScreenshotHelper {
    private static final String TAG = "ScreenshotHelper";
    private MediaProjectionManager projectionManager;
    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private int width;
    private int height;
    private int density;

    private Context context;

    public ScreenshotHelper(Context context) {
        this.context = context;
        projectionManager = (MediaProjectionManager) context.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        DisplayMetrics metrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getRealMetrics(metrics);
        width = metrics.widthPixels;
        height = metrics.heightPixels;
        density = metrics.densityDpi;
    }

    public Intent getScreenCaptureIntent() {
        return projectionManager.createScreenCaptureIntent();
    }

    public interface ScreenshotCallback {
        void onScreenshotTaken(String base64Image);
        void onError(String error);
    }

    public void startProjectionAndTakeScreenshot(int resultCode, Intent resultData, ScreenshotCallback callback) {
        Intent serviceIntent = new Intent(context, ScreenCaptureService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        // Give the ScreenCaptureService a little time to call startForeground() to avoid Android 14 SecurityException
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            try {
                mediaProjection = projectionManager.getMediaProjection(resultCode, resultData);
                if (mediaProjection == null) {
                    context.stopService(serviceIntent);
                    callback.onError("Failed to get MediaProjection. It returned null.");
                    return;
                }

                // Android 14+ requires registering a callback before creating the virtual display
                mediaProjection.registerCallback(new MediaProjection.Callback() {
                    @Override
                    public void onStop() {
                        super.onStop();
                        stopProjection();
                    }
                }, new android.os.Handler(android.os.Looper.getMainLooper()));

                imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2);
                virtualDisplay = mediaProjection.createVirtualDisplay("ScreenCapture",
                        width, height, density,
                        DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                        imageReader.getSurface(), null, null);

                imageReader.setOnImageAvailableListener(reader -> {
                    Image image = null;
                    try {
                        image = reader.acquireLatestImage();
                        if (image != null) {
                            Image.Plane[] planes = image.getPlanes();
                            ByteBuffer buffer = planes[0].getBuffer();
                            int pixelStride = planes[0].getPixelStride();
                            int rowStride = planes[0].getRowStride();
                            int rowPadding = rowStride - pixelStride * width;

                            Bitmap bitmap = Bitmap.createBitmap(width + rowPadding / pixelStride, height, Bitmap.Config.ARGB_8888);
                            bitmap.copyPixelsFromBuffer(buffer);
                            
                            // Crop the padding if necessary
                            Bitmap croppedBitmap = Bitmap.createBitmap(bitmap, 0, 0, width, height);

                            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                            // Compress significantly to save memory/tokens when sending to LLM
                            croppedBitmap.compress(Bitmap.CompressFormat.JPEG, 60, outputStream);
                            String base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP);
                            
                            callback.onScreenshotTaken(base64);

                            // Cleanup immediately to avoid memory leaks
                            stopProjection();
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error processing screenshot", e);
                        callback.onError(e.getMessage());
                        stopProjection();
                    } finally {
                        if (image != null) {
                            image.close();
                        }
                        // clear listener so we only get one frame
                        imageReader.setOnImageAvailableListener(null, null); 
                    }
                }, new android.os.Handler(android.os.Looper.getMainLooper()));

                // Add a 3-second timeout fallback in case the screen is perfectly static and no frame is emitted.
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    if (mediaProjection != null) {
                        // If mediaProjection is not null after 3s, the callback hasn't finished.
                        callback.onError("Screenshot capture timed out. The screen might be completely static or permission was lost.");
                        stopProjection();
                    }
                }, 3000);

            } catch (Exception exception) {
                context.stopService(serviceIntent);
                callback.onError("MediaProjection exception: " + exception.getMessage());
            }
        }, 400); // 400ms delay to ensure foreground service is running
    }

    private void stopProjection() {
        if (virtualDisplay != null) {
            virtualDisplay.release();
            virtualDisplay = null;
        }
        if (imageReader != null) {
            imageReader.close();
            imageReader = null;
        }
        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }
        context.stopService(new Intent(context, ScreenCaptureService.class));
    }
}
