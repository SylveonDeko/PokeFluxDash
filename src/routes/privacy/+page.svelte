<!-- routes/privacy/+page.svelte -->
<script>
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { SITE_URL } from "$lib/config/site";
  let date = "3rd November 2026";
  let email = "sylveon@mewdeko.tech";
</script>

<svelte:head>
  <title>{m.legal.privacyDescription()}</title>
  <meta content={m.legal.privacyDescription()} property="og:title" />
  <meta content={m.legal.privacyIntro()} name="description" />
  <meta content={m.legal.privacyIntro()} property="og:description" />
  <meta content={m.legal.privacyIntro()} name="twitter:description" />
  <meta content="{SITE_URL}/privacy" property="og:url" />
  <link href="{SITE_URL}/privacy" rel="canonical" />
</svelte:head>

<div class="min-h-[calc(100vh-5.5rem)] w-full px-4 py-12 flex justify-center" style="color: {$colorStore.text};">
  <div class="space-y-5 w-full max-w-3xl">
    <h1 class="text-3xl font-semibold">{m.legal.privacyDescription()}</h1>

    <p>{m.legal.privacyIntro()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyWhatDataDoWeCollect()}</h2>

    <p>{m.legal.privacyWhatDataIntro()}</p>
    <div>
      <ul class="list-disc pl-6 space-y-1">
        <li>{m.legal.privacyListUserId()}</li>
        <li>{m.legal.privacyListNames()}</li>
        <li>{m.legal.privacyListGameData()}</li>
        <li>{m.legal.privacyListServerIds()}</li>
        <li>{m.legal.privacyListTrades()}</li>
        <li>{@html m.legal.privacyListRiskScores()}</li>
        <li>{m.legal.privacyListBansAndNotes()}</li>
        <li>{m.legal.privacyListSignInTokens()}</li>
      </ul>
    </div>

    <h2 class="text-2xl font-semibold">{m.legal.privacyHowDoWeCollect()}</h2>

    <p>{m.legal.privacyHowCollectIntro()}</p>
    <div>
      <ul class="list-disc pl-6 space-y-1">
        <li>{m.legal.privacyHowCollectCommands()}</li>
        <li>{m.legal.privacyHowCollectMessages()}</li>
        <li>{m.legal.privacyHowCollectTrading()}</li>
        <li>{m.legal.privacyHowCollectSignIn()}</li>
      </ul>
    </div>

    <h2 class="text-2xl font-semibold">{m.legal.privacyHowWillWeUse()}</h2>

    <p>{m.legal.privacyUseIntro()}</p>
    <div>
      <ul class="list-disc pl-6 space-y-1">
        <li>{m.legal.privacyUseRunGame()}</li>
        <li>{m.legal.privacyUseLeaderboard()}</li>
        <li>{m.legal.privacyUseFairPlay()}</li>
        <li>{m.legal.privacyUseErrors()}</li>
      </ul>
    </div>

    <p>{m.legal.privacyWeDoNotSell()}</p>

    <h2 class="text-2xl font-semibold" id="message-content">{m.legal.privacyMessageContent()}</h2>

    <p>{m.legal.privacyMessageContentReads()}</p>

    <p>{m.legal.privacyMessageContentNotStored()}</p>

    <h2 class="text-2xl font-semibold" id="trading">{m.legal.privacyTradingAndFairPlay()}</h2>

    <p>{m.legal.privacyTradingRecords()}</p>

    <p>{m.legal.privacyTradingChecks()}</p>

    <p>{m.legal.privacyTradingActions()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyHowDoWeStore()}</h2>

    <p>{m.legal.privacyStorageDatabases()}</p>

    <p>{m.legal.privacyDataKeptUntilDeleted()}</p>

    <p>{m.legal.privacyBotLogsRecord()}</p>

    <p>{m.legal.privacyLogsStaffChannel()}</p>

    <p>{m.legal.privacyDashboardSignIn()}</p>

    <p>{m.legal.privacyDashboardTokensStorage()}</p>

    <p>{m.legal.privacyDashboardBrowserStorage()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyWhoElseProcesses()}</h2>

    <p>{m.legal.privacyProvidersHosting()}</p>

    <p>{m.legal.privacyProvidersCdn()}</p>

    <p>{m.legal.privacyProvidersSentry()}</p>

    <p>{m.legal.privacyFluxerProcesses()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyDeletingYourData()}</h2>

    <p>{m.legal.privacyDeletionHow({ email })}</p>

    <p>{m.legal.privacyDeletionKeptRecords()}</p>

    <p>{m.legal.privacyHideFromLeaderboard()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyYourRights()}</h2>

    <p>{m.legal.privacyRightsIntro()}</p>
    <div>
      <ul class="list-disc pl-6 space-y-1">
        <li>{m.legal.privacyRightToAccess()}</li>
        <li>{m.legal.privacyRightToRectification()}</li>
        <li>{m.legal.privacyRightToErasure()}</li>
        <li>{m.legal.privacyRightToRestrict()}</li>
        <li>{m.legal.privacyAskAPersonToReview()}</li>
      </ul>
    </div>

    <p>{m.legal.privacyIfYouMakeARequest({ email })}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyChangesToOurPrivacyPolicy()}</h2>

    <p>{m.legal.privacyPolicyLastUpdated({ date })}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyHowToContactUs()}</h2>

    <p>{m.legal.privacyIfYouHaveAnyQuestions({ email })}</p>

    <h2 class="text-2xl font-semibold">{m.legal.privacyContactAuthority()}</h2>

    <p>{m.legal.privacyReportComplaint()}</p>
  </div>
</div>
