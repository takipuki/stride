<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import SunIcon from '@lucide/svelte/icons/sun';
  import UserIcon from '@lucide/svelte/icons/user';
  import { mode, toggleMode } from 'mode-watcher';

  import { goto } from '$app/navigation';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { useSidebar } from '$lib/components/ui/sidebar/index.js';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime.js';
  import type { Session } from '$lib/session';
  import { clearSession } from '$lib/session';

  let { session }: { session: Session } = $props();
  const sidebar = useSidebar();

  function handleLogout() {
    clearSession();
    goto('/login');
  }

  const localeLabels: Record<string, string> = {
    en: 'English',
    bn: 'বাংলা',
  };
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            <Avatar.Root class="size-8 rounded-lg">
              {#if session.avatarUrl}
                <Avatar.Image src={session.avatarUrl} alt={session.name} />
              {/if}
              <Avatar.Fallback class="rounded-lg">
                {session.name.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{session.name}</span>
              <div class="flex items-center gap-1.5">
                <span class="truncate text-xs">{session.email}</span>
                <span
                  class="inline-flex items-center rounded-sm bg-sidebar-primary/15 px-1 py-px text-[10px] font-medium text-sidebar-primary capitalize"
                >
                  {session.role}
                </span>
              </div>
            </div>
            <ChevronsUpDownIcon class="ms-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <Avatar.Root class="size-8 rounded-lg">
              {#if session.avatarUrl}
                <Avatar.Image src={session.avatarUrl} alt={session.name} />
              {/if}
              <Avatar.Fallback class="rounded-lg">
                {session.name.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{session.name}</span>
              <div class="flex items-center gap-1.5">
                <span class="truncate text-xs">{session.email}</span>
                <span
                  class="inline-flex items-center rounded-sm bg-sidebar-primary/15 px-1 py-px text-[10px] font-medium text-sidebar-primary capitalize"
                >
                  {session.role}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item onclick={() => goto(`/users/${session.userId}`)}>
            <UserIcon />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/settings')}>
            <SettingsIcon />
            Settings
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}
              <SunIcon />
              Light Mode
            {:else}
              <MoonIcon />
              Dark Mode
            {/if}
          </DropdownMenu.Item>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>
              <GlobeIcon />
              Language
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              {#each locales as locale (locale)}
                <DropdownMenu.Item onclick={() => setLocale(locale)}>
                  {localeLabels[locale] ?? locale}
                  {#if getLocale() === locale}
                    <CheckIcon class="ml-auto size-4" />
                  {/if}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleLogout}>
          <LogOutIcon />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
