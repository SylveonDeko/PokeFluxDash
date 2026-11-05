<!-- routes/terms/+page.svelte -->
<script>
  import { m } from "$lib/i18n";
  import { colorStore } from "$lib/stores/colorStore";
  import { SITE_URL } from "$lib/config/site";
  let date = "3rd November 2026";
  let email = "sylveon@mewdeko.tech";
</script>

<svelte:head>
  <title>{m.legal.termsTitle()}</title>
  <meta content={m.legal.termsTitle()} property="og:title" />
  <meta content={m.legal.termsByUsing()} name="description" />
  <meta content={m.legal.termsByUsing()} property="og:description" />
  <meta content="{SITE_URL}/terms" property="og:url" />
  <link href="{SITE_URL}/terms" rel="canonical" />
</svelte:head>

<div class="min-h-[calc(100vh-5.5rem)] w-full px-4 py-12 flex justify-center" style="color: {$colorStore.text};">
  <div class="space-y-5 w-full max-w-3xl">
    <h1 class="text-3xl font-semibold">{m.legal.termsTitle()}</h1>

    <p>{m.legal.termsByUsing()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsTheService()}</h2>

    <p>{@html m.legal.termsServiceCovers()}</p>

    <p>{m.legal.termsServiceFluxer()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsVirtualItems()}</h2>

    <p>{m.legal.termsNoRealValue()}</p>

    <p>{m.legal.termsNoRealMoney()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsFairPlay()}</h2>

    <p>{m.legal.termsFairPlayIntro()}</p>
    <div>
      <ul class="list-disc pl-6 space-y-1">
        <li>{m.legal.termsFairPlayAutomation()}</li>
        <li>{m.legal.termsFairPlayAlts()}</li>
        <li>{m.legal.termsFairPlayBugs()}</li>
        <li>{m.legal.termsFairPlayTradingAbuse()}</li>
        <li>{m.legal.termsFairPlayHarass()}</li>
        <li>{m.legal.termsFairPlayFluxer()}</li>
      </ul>
    </div>

    <h2 class="text-2xl font-semibold">{m.legal.termsModeration()}</h2>

    <p>{m.legal.termsModerationBody()}</p>

    <p>{m.legal.termsModerationAppeals()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsNoWarranty()}</h2>

    <p>{m.legal.termsNoWarrantyBody()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsLicence()}</h2>

    <p>{m.legal.termsLicenceBody()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsChanges()}</h2>

    <p>{m.legal.termsChangesBody()}</p>

    <h2 class="text-2xl font-semibold">{m.legal.termsContactInformation()}</h2>

    <p>{m.legal.termsIfYouHaveAnyQuestions({ email })}</p>

    <p>{m.legal.termsLastUpdated({ date })}</p>
  </div>
</div>
