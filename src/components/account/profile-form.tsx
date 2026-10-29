import * as React from 'react'
import { Button } from '~/components/ui/button'
import { jerseySizeGuide } from '~/data/shop'
import {
  ACCOUNT_BLOOD_TYPES,
  ACCOUNT_GENDERS,
  accountInitials,
  type AccountProfile,
} from '~/lib/account'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'
import {
  AccountDateOfBirthField,
  AccountField,
  AccountSelect,
  AddressFields,
  SaveBar,
} from '~/components/account/fields'

type ProfileEdits = Omit<AccountProfile, 'avatarUrl' | 'email'>

type ProfileFormState = {
  edits: Partial<ProfileEdits>
  pending: boolean
  avatarPending: boolean
  error: string
}

type ProfileFormAction =
  | { type: 'edit'; key: keyof ProfileEdits; value: string }
  | { type: 'submit' }
  | { type: 'saved' }
  | { type: 'avatar-start' }
  | { type: 'avatar-settled' }
  | { type: 'fail'; error: string }

const initialProfileForm: ProfileFormState = {
  edits: {},
  pending: false,
  avatarPending: false,
  error: '',
}

function profileFormReducer(
  state: ProfileFormState,
  action: ProfileFormAction,
): ProfileFormState {
  switch (action.type) {
    case 'edit':
      return {
        ...state,
        edits: { ...state.edits, [action.key]: action.value },
      }
    case 'submit':
      return { ...state, pending: true, error: '' }
    case 'saved':
      return { ...state, pending: false, error: '', edits: {} }
    case 'avatar-start':
      return { ...state, avatarPending: true, error: '' }
    case 'avatar-settled':
      return { ...state, avatarPending: false }
    case 'fail':
      return {
        ...state,
        pending: false,
        avatarPending: false,
        error: action.error,
      }
  }
}

export function AccountProfilePanel({
  profile,
  onSave,
  onUploadAvatar,
  onClearAvatar,
}: {
  profile: AccountProfile
  onSave: (draft: AccountProfile) => Promise<void>
  onUploadAvatar: (file: File) => Promise<void>
  onClearAvatar: () => Promise<void>
}) {
  const [form, dispatch] = React.useReducer(
    profileFormReducer,
    initialProfileForm,
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const draft = { ...profile, ...form.edits }

  function setField<K extends keyof ProfileEdits>(
    key: K,
    value: ProfileEdits[K],
  ) {
    dispatch({ type: 'edit', key, value })
  }

  async function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      dispatch({ type: 'fail', error: 'Use a JPG, PNG, or WebP image.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      dispatch({ type: 'fail', error: 'Image must be 2MB or smaller.' })
      return
    }

    dispatch({ type: 'avatar-start' })
    try {
      await onUploadAvatar(file)
      dispatch({ type: 'avatar-settled' })
    } catch {
      dispatch({ type: 'fail', error: 'Could not upload avatar.' })
    }
  }

  async function clearAvatar() {
    dispatch({ type: 'avatar-start' })
    try {
      await onClearAvatar()
      dispatch({ type: 'avatar-settled' })
    } catch {
      dispatch({ type: 'fail', error: 'Could not remove avatar.' })
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    dispatch({ type: 'submit' })
    try {
      await onSave(draft)
      dispatch({ type: 'saved' })
    } catch {
      dispatch({ type: 'fail', error: 'Could not save profile' })
    }
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Profile
      </h2>

      <div className="mt-6 flex items-center gap-4">
        <Avatar className="size-20 after:rounded-full data-[size=default]:size-20">
          {draft.avatarUrl ? (
            <AvatarImage alt="" src={draft.avatarUrl} />
          ) : null}
          <AvatarFallback className="bg-foreground font-heading text-lg font-semibold text-background">
            {accountInitials(draft)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Avatar
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, or WebP up to 2MB.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void onAvatarChange(event)}
              ref={fileInputRef}
              type="file"
            />
            <Button
              disabled={form.avatarPending}
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              {form.avatarPending ? (<><Spinner /> Uploading…</>) : 'Change photo'}
            </Button>
            {draft.avatarUrl ? (
              <Button
                disabled={form.avatarPending}
                onClick={() => void clearAvatar()}
                size="sm"
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <AccountField
          autoComplete="given-name"
          id="firstName"
          label="First name"
          onChange={(value) => setField('firstName', value)}
          required
          value={draft.firstName}
        />
        <AccountField
          autoComplete="family-name"
          id="lastName"
          label="Last name"
          onChange={(value) => setField('lastName', value)}
          required
          value={draft.lastName}
        />
        <AccountField
          autoComplete="email"
          id="email"
          label="Email"
          readOnly
          type="email"
          value={draft.email}
        />
        <AccountField
          autoComplete="tel"
          id="phone"
          label="Phone"
          onChange={(value) => setField('phone', value)}
          type="tel"
          value={draft.phone}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Rider details
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Helps with event registration and medical info on the road.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AccountSelect
          allowEmpty
          id="gender"
          label="Gender"
          onChange={(value) => setField('gender', value)}
          options={ACCOUNT_GENDERS.map((option) => ({
            value: option,
            label: option,
          }))}
          value={draft.gender}
        />
        <AccountSelect
          allowEmpty
          id="bloodType"
          label="Blood type"
          onChange={(value) => setField('bloodType', value)}
          options={ACCOUNT_BLOOD_TYPES.map((option) => ({
            value: option,
            label: option,
          }))}
          value={draft.bloodType}
        />
        <AccountDateOfBirthField
          id="dateOfBirth"
          label="Date of birth"
          onChange={(value) => setField('dateOfBirth', value)}
          value={draft.dateOfBirth}
        />
        <AccountField
          autoComplete="country-name"
          id="nationality"
          label="Nationality"
          onChange={(value) => setField('nationality', value)}
          value={draft.nationality}
        />
        <AccountField
          id="idNumber"
          label="KTP or ID"
          onChange={(value) => setField('idNumber', value)}
          value={draft.idNumber}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Emergency contact
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Who we should call if something happens on a ride.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AccountField
          autoComplete="name"
          id="emergencyContactName"
          label="Contact name"
          onChange={(value) => setField('emergencyContactName', value)}
          value={draft.emergencyContactName}
        />
        <AccountField
          autoComplete="tel"
          id="emergencyContactPhone"
          label="Contact phone"
          onChange={(value) => setField('emergencyContactPhone', value)}
          type="tel"
          value={draft.emergencyContactPhone}
        />
      </div>

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Address
      </h3>
      <AddressFields
        idPrefix="profile"
        onChange={(key, value) => setField(key, value)}
        value={draft}
      />

      <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
        Preferred Jersey Size
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Race-fit. We’ll remember this when you add a jersey.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {jerseySizeGuide.sizes.map((size) => {
          const active = draft.jerseySize === size
          return (
            <button
              aria-pressed={active}
              className={cn(
                'min-w-12 border px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40',
              )}
              key={size}
              onClick={() => setField('jerseySize', size)}
              type="button"
            >
              {size}
            </button>
          )
        })}
      </div>

      {form.error ? (
        <p className="mt-4 text-sm text-destructive">{form.error}</p>
      ) : null}

      <SaveBar label="Save changes" pending={form.pending} />
    </form>
  )
}
