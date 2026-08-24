export async function uploadToCloudinary({ file, cloudName, uploadPreset, onProgress }) {
  if (!cloudName) {
    throw new Error('Cloudinary Cloud Name is required')
  }
  if (!uploadPreset) {
    throw new Error('Cloudinary Upload Preset is required')
  }

  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' : 'image'
  const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/${resourceType}/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    formData.append('file', file)
    formData.append('upload_preset', uploadPreset.trim())

    xhr.open('POST', url, true)

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          resolve(res.secure_url)
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'))
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          reject(new Error(res.error?.message || `Cloudinary upload error (${xhr.status})`))
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'))
    xhr.send(formData)
  })
}
