# Google OAuth Verification Guide

This guide walks you through getting Google's approval to use Gemini API with OAuth, so users can "Connect with Google" and have AI features work automatically.

**Timeline:** 4-6 weeks for Google review
**Difficulty:** Follow the steps, no coding needed

---

## Prerequisites

Before starting, make sure these are deployed:
- ✅ Privacy Policy: https://flywheel-coach.vercel.app/privacy
- ✅ Terms of Service: https://flywheel-coach.vercel.app/terms

---

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the Google account that owns Flywheel Coach
3. Select your project (or create one if you haven't)

---

## Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**

2. If you haven't configured it yet:
   - Select **External** (for public users)
   - Click **Create**

3. Fill in the **App Information**:
   | Field | Value |
   |-------|-------|
   | App name | Flywheel Coach |
   | User support email | your-email@example.com |
   | App logo | (upload your logo, 120x120px) |

4. Fill in the **App domain**:
   | Field | Value |
   |-------|-------|
   | Application home page | https://flywheel-coach.vercel.app |
   | Application privacy policy link | https://flywheel-coach.vercel.app/privacy |
   | Application terms of service link | https://flywheel-coach.vercel.app/terms |

5. Add **Authorized domains**:
   - `flywheel-coach.vercel.app`
   - `vercel.app`

6. **Developer contact information**:
   - Add your email address

7. Click **Save and Continue**

---

## Step 3: Add Scopes

1. Click **Add or Remove Scopes**

2. Find and select these scopes:
   - `https://www.googleapis.com/auth/generative-language.retriever`
   - `https://www.googleapis.com/auth/generative-language.tuning` (optional, for future features)

3. If you can't find them, click **Manually add scopes** and paste:
   ```
   https://www.googleapis.com/auth/generative-language.retriever
   ```

4. Click **Update** then **Save and Continue**

---

## Step 4: Add Test Users (For Testing Before Verification)

1. While awaiting verification, add test users who can try the OAuth flow
2. Click **Add Users**
3. Enter email addresses of people who should test
4. Click **Save and Continue**

---

## Step 5: Submit for Verification

1. Go back to **OAuth consent screen**
2. Click **Publish App** (if in testing mode)
3. Click **Prepare for Verification**

4. Fill in the verification form:

### App Information
| Question | Answer |
|----------|--------|
| What is your app's primary function? | Flywheel Coach is an AI-powered platform that helps users build applications by generating structured prompts. It uses Google's Gemini AI to guide users through the app-building process. |
| Why does your app need these scopes? | We need the generative-language scope to use Google's Gemini AI API on behalf of users. This enables our core feature: generating personalized prompts that help users build applications. Users connect their Google account to use their Gemini quota for AI features. |

### Verification Requirements
| Requirement | What to Provide |
|-------------|-----------------|
| Privacy Policy | https://flywheel-coach.vercel.app/privacy |
| Terms of Service | https://flywheel-coach.vercel.app/terms |
| YouTube Video | Record a 2-3 minute demo (see below) |

---

## Step 6: Create Demo Video

Google requires a video demonstrating how you use the sensitive scopes.

### Video Script:

**[0:00-0:30] Introduction**
"This is Flywheel Coach, an AI-powered platform that helps users build applications. I'll demonstrate how we use Google's Gemini API through OAuth authentication."

**[0:30-1:30] OAuth Flow**
1. Show the Settings page with "Connect Google for AI" button
2. Click the button
3. Show Google's OAuth consent screen
4. Point out: "Users see exactly what permissions they're granting"
5. Complete the authorization

**[1:30-2:30] Using the API**
1. Navigate to create a new app cycle
2. Show how Gemini generates prompts
3. Explain: "We only use the Gemini API to generate prompts for app building. We don't access any other user data."

**[2:30-3:00] Conclusion**
"Flywheel Coach uses Gemini AI to help users build apps. We only request the scopes we need, and users can disconnect at any time from Settings."

### Recording Tips:
- Use screen recording (QuickTime, Loom, or OBS)
- Speak clearly
- Show the full OAuth flow
- Upload to YouTube as Unlisted

---

## Step 7: Submit and Wait

1. After completing all fields, click **Submit for Verification**
2. Google will review your app
3. Timeline: Typically 4-6 weeks
4. You may receive follow-up questions via email

---

## After Approval

Once approved, I'll add the OAuth "Connect Google" button to the Settings page, and users can seamlessly connect their Google account for AI features.

---

## Current Status

| Step | Status |
|------|--------|
| Privacy Policy page | ✅ Deployed |
| Terms of Service page | ✅ Deployed |
| OAuth Consent Screen | ⏳ You need to configure |
| Add Scopes | ⏳ You need to add |
| Demo Video | ⏳ You need to record |
| Submit for Verification | ⏳ You need to submit |
| Google Review | ⏳ 4-6 weeks after submission |
| Add OAuth button to app | ⏳ After approval |

---

## Questions?

If you run into issues during this process, let me know and I can help troubleshoot.
