import { supabase } from "@/lib/supabase"

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export async function uploadPDF(file: File, submissionId: string): Promise<UploadResult> {
  try {
    console.log("Starting PDF upload:", file.name, "Size:", file.size)

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error("User not authenticated for upload:", sessionError)
      return {
        success: false,
        error: "You must be logged in to upload files",
      }
    }

    console.log("User authenticated for upload:", session.user.email)

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${submissionId}-${Date.now()}.${fileExt}`
    const filePath = `submissions/${fileName}`

    console.log("Uploading to path:", filePath)

    // First, ensure the bucket exists and is properly configured
    const bucketReady = await ensureBucketReady()
    if (!bucketReady) {
      return {
        success: false,
        error: "Storage bucket is not ready. Please try again or contact support.",
      }
    }

    // Upload file to Supabase Storage with explicit options
    const { data, error } = await supabase.storage.from("hackathon-pdfs").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Don't overwrite existing files
      duplex: "half", // Required for some environments
    })

    if (error) {
      console.error("Upload error:", error)

      // Handle specific RLS errors
      if (error.message?.includes("row-level security") || error.message?.includes("policy")) {
        return {
          success: false,
          error: "Storage permissions not configured properly. Please contact administrator to fix storage policies.",
        }
      }

      // Handle bucket not found
      if (error.message?.includes("Bucket not found") || error.message?.includes("bucket_id")) {
        console.log("Bucket not found, attempting to create...")
        const bucketCreated = await createBucketIfNotExists()

        if (bucketCreated) {
          // Retry upload after bucket creation
          const { data: retryData, error: retryError } = await supabase.storage
            .from("hackathon-pdfs")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (retryError) {
            return {
              success: false,
              error: `Upload failed after bucket creation: ${retryError.message}`,
            }
          }

          // Get public URL for retry
          const { data: urlData } = supabase.storage.from("hackathon-pdfs").getPublicUrl(filePath)

          return {
            success: true,
            url: urlData.publicUrl,
            path: filePath,
          }
        }
      }

      // Handle file size errors
      if (error.message?.includes("size") || error.message?.includes("too large")) {
        return {
          success: false,
          error: "File is too large. Please use a PDF under 10MB.",
        }
      }

      // Handle duplicate file names
      if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
        // Try with a different filename
        const newFileName = `${submissionId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${fileExt}`
        const newFilePath = `submissions/${newFileName}`

        const { data: retryData, error: retryError } = await supabase.storage
          .from("hackathon-pdfs")
          .upload(newFilePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (retryError) {
          return {
            success: false,
            error: retryError.message,
          }
        }

        const { data: urlData } = supabase.storage.from("hackathon-pdfs").getPublicUrl(newFilePath)

        return {
          success: true,
          url: urlData.publicUrl,
          path: newFilePath,
        }
      }

      return {
        success: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        success: false,
        error: "Upload completed but no data returned",
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("hackathon-pdfs").getPublicUrl(filePath)

    console.log("PDF uploaded successfully:", urlData.publicUrl)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error: any) {
    console.error("Upload failed with exception:", error)
    return {
      success: false,
      error: error.message || "Upload failed with unknown error",
    }
  }
}

export async function deletePDF(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from("hackathon-pdfs").remove([filePath])

    if (error) {
      console.error("Delete error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Delete failed:", error)
    return false
  }
}

export function getPDFUrl(filePath: string): string {
  const { data } = supabase.storage.from("hackathon-pdfs").getPublicUrl(filePath)
  return data.publicUrl
}

// Ensure bucket is ready with proper configuration
async function ensureBucketReady(): Promise<boolean> {
  try {
    console.log("Checking if bucket is ready...")

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return false
    }

    const bucket = buckets?.find((b) => b.name === "hackathon-pdfs")

    if (!bucket) {
      console.log("Bucket doesn't exist, creating...")
      return await createBucketIfNotExists()
    }

    // Check if bucket is public
    if (!bucket.public) {
      console.log("Bucket exists but is not public, updating...")
      const { error: updateError } = await supabase.storage.updateBucket("hackathon-pdfs", {
        public: true,
      })

      if (updateError) {
        console.error("Error making bucket public:", updateError)
        return false
      }
    }

    console.log("Bucket is ready:", bucket.name, "Public:", bucket.public)
    return true
  } catch (error) {
    console.error("Error ensuring bucket is ready:", error)
    return false
  }
}

// Create bucket if it doesn't exist (with better error handling)
async function createBucketIfNotExists(): Promise<boolean> {
  try {
    console.log("Attempting to create storage bucket...")

    // Try to create bucket with proper configuration
    const { data, error: createError } = await supabase.storage.createBucket("hackathon-pdfs", {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["application/pdf"],
    })

    if (createError) {
      console.error("Error creating bucket:", createError)

      // If bucket already exists, that's fine
      if (createError.message?.includes("already exists") || createError.message?.includes("duplicate")) {
        console.log("Bucket already exists, continuing...")
        return true
      }

      return false
    }

    console.log("Storage bucket created successfully:", data)
    return true
  } catch (error) {
    console.error("Bucket creation failed:", error)
    return false
  }
}

// Check if bucket exists (safer approach)
export async function checkBucketExists(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error("Error listing buckets:", error)
      return false
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "hackathon-pdfs")
    console.log("Bucket exists:", bucketExists)

    return bucketExists || false
  } catch (error) {
    console.error("Error checking bucket existence:", error)
    return false
  }
}

// Initialize storage (non-blocking, safer approach)
export async function initializeStorage(): Promise<void> {
  try {
    console.log("Initializing storage...")

    // Check authentication first
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      console.log("No authenticated user, skipping storage initialization")
      return
    }

    // Check if bucket is ready
    const bucketReady = await ensureBucketReady()

    if (bucketReady) {
      console.log("Storage initialization complete")
    } else {
      console.log("Storage initialization incomplete - bucket not ready")
    }
  } catch (error) {
    console.error("Storage initialization failed (this is non-critical):", error)
    // Don't throw error - storage will be handled during upload
  }
}

// Test storage access (for debugging)
export async function testStorageAccess(): Promise<{ success: boolean; message: string }> {
  try {
    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return {
        success: false,
        message: "Not authenticated. Please sign in to test storage.",
      }
    }

    // Try to list buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return {
        success: false,
        message: `Cannot list buckets: ${listError.message}`,
      }
    }

    const bucket = buckets?.find((b) => b.name === "hackathon-pdfs")

    if (!bucket) {
      return {
        success: false,
        message: "Bucket 'hackathon-pdfs' does not exist. It will be created on first upload.",
      }
    }

    // Try to list files in bucket
    const { data: files, error: filesError } = await supabase.storage.from("hackathon-pdfs").list("submissions", {
      limit: 1,
    })

    if (filesError) {
      if (filesError.message?.includes("row-level security")) {
        return {
          success: false,
          message: "Storage policies not configured properly. RLS is blocking access.",
        }
      }

      return {
        success: false,
        message: `Cannot access bucket: ${filesError.message}`,
      }
    }

    return {
      success: true,
      message: `Storage is working! Bucket: ${bucket.name}, Public: ${bucket.public}, Files: ${files?.length || 0}`,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Storage test failed: ${error.message}`,
    }
  }
}
