/** Local review likes (UI fallback — no DB column required) */

const LIKES_KEY = 'filmhub_review_likes'
const USER_LIKED_KEY = 'filmhub_review_liked_ids'

function readLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}')
  } catch {
    return {}
  }
}

function readUserLiked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(USER_LIKED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveLikes(map) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(map))
}

function saveUserLiked(set) {
  localStorage.setItem(USER_LIKED_KEY, JSON.stringify([...set]))
}

export function getReviewLikeCount(reviewId) {
  const likes = readLikes()
  return likes[reviewId] ?? 0
}

export function hasUserLikedReview(reviewId) {
  return readUserLiked().has(String(reviewId))
}

export function toggleReviewLike(reviewId) {
  const id = String(reviewId)
  const likes = readLikes()
  const userLiked = readUserLiked()
  const wasLiked = userLiked.has(id)

  if (wasLiked) {
    userLiked.delete(id)
    likes[id] = Math.max(0, (likes[id] ?? 1) - 1)
  } else {
    userLiked.add(id)
    likes[id] = (likes[id] ?? 0) + 1
  }

  saveLikes(likes)
  saveUserLiked(userLiked)
  return { count: likes[id] ?? 0, liked: !wasLiked }
}
