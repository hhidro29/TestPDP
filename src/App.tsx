import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  MoreVertical,
  Plus,
  X,
} from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import './App.css'

type AccountStatus = 'existing' | 'new'
type LookupState =
  | 'idle'
  | 'existing-old-account'
  | 'existing-not-registered'
  | 'existing-child-phone'
  | 'existing-parent-single-child'
  | 'existing-parent-with-children'
  | 'existing-parent-empty'
  | 'new-available'
  | 'new-registered'
type CalloutVariant = 'info' | 'warning' | 'danger' | 'success'
type PrototypeOptionId = '1' | '2' | '3'
type ContactOwner = 'child' | 'parent' | null
type ProfileTarget = 'existing' | 'new' | null
type WizardStep = 1 | 2 | 3 | 4 | 5
type ChildProfile = {
  grade: string
  hasActivePackage?: boolean
  id: string
  name: string
}
type ParentProfileAccount = {
  name: string
  phone: string
  profiles: ChildProfile[]
}

const benefits = [
  'ADAPTO: Satu-satunya video belajar interaktif di Indonesia. Bisa sesuaikan pemahaman siswa!',
  '>65rb video belajar premium dengan ADAPTO',
  '>400rb latihan soal serta pembahasan',
  'Latihan Bab, Banksoal, dan Tryout PTS, PAS, US di ruanglatihan',
  'Akses semua mata pelajaran 10-11-12 SMA/SMK',
  'Rangkuman infografis di setiap bab',
  'Playlist Belajar (Rencana belajar dari Master Teacher)',
  'Download materi offline',
  'Ruangguru Adventure & Teman Belajar',
  'Laporan Belajar',
]

const prototypeOptions: Array<{
  id: PrototypeOptionId
  label: string
  title: string
  summary: string
  steps: string[]
}> = [
  {
    id: '1',
    label: 'Opsi 1',
    title: 'Checkout-led Migration',
    summary: 'Migrasi muncul di dalam draft invoice. Ini baseline yang paling dekat dengan flow bayar saat ini.',
    steps: ['Pilih status akun', 'Cek nomor', 'Lengkapi data migrasi', 'Review lalu pilih metode bayar'],
  },
  {
    id: '2',
    label: 'Opsi 2',
    title: 'Explicit Mapping',
    summary: 'Agent memilih pemilik kontak akun lama secara eksplisit sebelum mengisi data migrasi.',
    steps: ['Cek akun lama', 'Pilih kontak milik Anak/Orang Tua', 'Cek No. HP orang tua', 'Review lalu pilih metode bayar'],
  },
  {
    id: '3',
    label: 'Opsi 3',
    title: 'Wizard Tujuan Pembelian',
    summary: 'Agent dipandu menentukan akun dan profil tujuan paket, sambil mengonversi akun lama bila diperlukan.',
    steps: ['Cari customer', 'Tentukan tujuan paket', 'Isi data orang tua', 'Isi profil anak', 'Review pembelian'],
  },
]

function isPrototypeOptionId(value: string | null): value is PrototypeOptionId {
  return value === '1' || value === '2' || value === '3'
}

function getInitialPrototypeOption(): PrototypeOptionId {
  if (typeof window === 'undefined') return '1'

  const option = new URLSearchParams(window.location.search).get('option')
  return isPrototypeOptionId(option) ? option : '1'
}

const existingAccount = {
  name: 'Firman Syahputra',
  email: 'firman.account@email.com',
}

const registeredParentAccount = {
  name: 'Reza Hardian',
  phone: '082487625328',
}

const parentAccountWithSingleChild: ParentProfileAccount = {
  name: 'Nadia Rahma',
  phone: '083331112222',
  profiles: [
    { grade: 'Kelas 10 SMA', id: 'firman', name: 'Firman Syahputra' },
  ],
}

const parentAccountWithChildren: ParentProfileAccount = {
  name: 'Agus Salim',
  phone: '0856342565342',
  profiles: [
    { grade: 'Kelas 10 SMA', id: 'firman', name: 'Firman Syahputra' },
    { grade: 'Kelas 8 SMP', hasActivePackage: true, id: 'salsabila', name: 'Salsabila Putri' },
  ],
}

const parentAccountWithoutChildren: ParentProfileAccount = {
  name: 'Dewi Kartika',
  phone: '084441112222',
  profiles: [],
}

function getRegisteredParentAccount(phone: string): { name: string; phone: string } | null {
  const normalizedPhone = phone.replace(/\D/g, '')

  if (normalizedPhone === registeredParentAccount.phone || normalizedPhone.includes('5328')) {
    return registeredParentAccount
  }

  if (isParentAccountWithSingleChildPhone(phone)) return parentAccountWithSingleChild
  if (isParentAccountWithChildrenPhone(phone)) return parentAccountWithChildren
  if (isParentAccountWithoutChildrenPhone(phone)) return parentAccountWithoutChildren

  return null
}

function canCheckParentPhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 8
}

function isParentAccountWithChildrenPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  return normalizedPhone === parentAccountWithChildren.phone || normalizedPhone.includes('342')
}

function isParentAccountWithSingleChildPhone(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  return normalizedPhone === parentAccountWithSingleChild.phone || normalizedPhone.includes('333')
}

function isParentAccountWithoutChildrenPhone(phone: string) {
  return phone.replace(/\D/g, '').includes('444')
}

function isParentProfileLookup(lookupState: LookupState) {
  return lookupState === 'existing-parent-single-child' || lookupState === 'existing-parent-with-children' || lookupState === 'existing-parent-empty'
}

function getLookupParentAccount(lookupState: LookupState): ParentProfileAccount | null {
  if (lookupState === 'existing-parent-single-child') return parentAccountWithSingleChild
  if (lookupState === 'existing-parent-with-children') return parentAccountWithChildren
  if (lookupState === 'existing-parent-empty') return parentAccountWithoutChildren

  return null
}

function isChildProfileContact(phone: string) {
  return phone.replace(/\D/g, '').includes('111')
}

function getWizardStepTitle(step: WizardStep) {
  const titles: Record<WizardStep, string> = {
    1: 'Cari customer',
    2: 'Tujuan paket',
    3: 'Data orang tua',
    4: 'Profil anak',
    5: 'Review pembelian',
  }

  return titles[step]
}

function App() {
  const [prototypeOption, setPrototypeOption] = useState<PrototypeOptionId>(getInitialPrototypeOption)
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [lookupState, setLookupState] = useState<LookupState>('idle')
  const [phone, setPhone] = useState('')
  const [usesParentIdentity, setUsesParentIdentity] = useState(false)
  const [contactOwner, setContactOwner] = useState<ContactOwner>(null)
  const [profileTarget, setProfileTarget] = useState<ProfileTarget>(null)
  const [selectedChildProfileId, setSelectedChildProfileId] = useState('')
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [parentPhone, setParentPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [childName, setChildName] = useState('')
  const [childPhone, setChildPhone] = useState('')
  const [childEmail, setChildEmail] = useState('')
  const [grade, setGrade] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [consent, setConsent] = useState(false)

  const isExistingFlow = accountStatus === 'existing'
  const isOptionTwo = prototypeOption === '2'
  const isOptionThree = prototypeOption === '3'
  const usesMappingDecision = isOptionTwo || isOptionThree
  const hasContactOwnerDecision = !usesMappingDecision || contactOwner !== null
  const parentContactSelected = usesMappingDecision ? contactOwner === 'parent' : usesParentIdentity
  const parentLookupAccount = getLookupParentAccount(lookupState)
  const selectedChildProfile = parentLookupAccount?.profiles.find((profile) => profile.id === selectedChildProfileId) ?? null
  const shouldCreateProfileForParent = Boolean(parentLookupAccount && profileTarget === 'new')
  const showMigrationForm = isExistingFlow && lookupState === 'existing-old-account' && hasContactOwnerDecision
  const showNewAccountForm = accountStatus === 'new' && lookupState === 'new-available'
  const effectiveParentPhone = parentLookupAccount?.phone ?? (showNewAccountForm ? parentPhone || phone : parentContactSelected ? parentPhone || phone : parentPhone)
  const effectiveParentAccount = parentContactSelected ? null : getRegisteredParentAccount(effectiveParentPhone)
  const effectiveParentName = parentLookupAccount?.name ?? (parentName || effectiveParentAccount?.name || '')
  const effectiveChildName = selectedChildProfile?.name ?? (showMigrationForm && !parentContactSelected ? childName || existingAccount.name : childName)
  const parentDataReady = Boolean(canCheckParentPhone(effectiveParentPhone) && effectiveParentName.trim())
  const childProfileFormReady = Boolean(childName.trim() && grade)
  const childDataReady = Boolean(effectiveChildName.trim() && (selectedChildProfile ? true : grade))
  const parentProfileTargetReady = Boolean(
    parentLookupAccount
    && (profileTarget === 'existing' ? selectedChildProfile : shouldCreateProfileForParent && childProfileFormReady),
  )
  const migrationFormReady = Boolean(showMigrationForm && parentDataReady && childDataReady)
  const newAccountFormReady = Boolean(
    showNewAccountForm
    && canCheckParentPhone(effectiveParentPhone)
    && parentName.trim()
    && childName.trim()
    && grade,
  )

  const cta = useMemo(() => {
    if (isOptionThree) {
      if (wizardStep === 1) {
        if (lookupState === 'existing-old-account') return { label: 'Lanjut ke Mapping', disabled: false }
        if (isParentProfileLookup(lookupState)) return { label: 'Lanjut Pilih Profil', disabled: false }
        if (accountStatus === 'new' && lookupState === 'new-available') return { label: 'Lanjut Isi Data Orang Tua', disabled: false }
        if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone' || lookupState === 'new-registered') {
          return { label: 'Ikuti Instruksi', disabled: true }
        }

        return { label: accountStatus ? 'Cek Akun Dulu' : 'Pilih Status Akun', disabled: true }
      }

      if (wizardStep === 2 && parentLookupAccount) {
        if (profileTarget === 'existing') return { label: 'Review Tujuan Paket', disabled: !selectedChildProfile }
        return { label: 'Lanjut Isi Profil Anak', disabled: profileTarget !== 'new' }
      }
      if (wizardStep === 2) return { label: 'Lanjut Isi Data Orang Tua', disabled: contactOwner === null }
      if (wizardStep === 3) return { label: 'Lanjut Isi Profil Anak', disabled: !parentDataReady }
      if (wizardStep === 4) return { label: parentLookupAccount ? 'Review Tujuan Paket' : 'Review Migrasi', disabled: parentLookupAccount ? !childProfileFormReady : !childDataReady }
      return { label: 'Lanjut Pilih Metode Bayar', disabled: !consent }
    }

    if (accountStatus === 'new' && lookupState === 'new-available') {
      return { label: newAccountFormReady ? 'Review & Pilih Metode Bayar' : 'Lengkapi Data Akun', disabled: !newAccountFormReady }
    }
    if (accountStatus === 'new' && lookupState === 'new-registered') return { label: 'Ikuti Instruksi', disabled: true }
    if (lookupState === 'idle') return { label: 'Cek Nomor Dulu', disabled: true }
    if (lookupState === 'existing-not-registered' || lookupState === 'existing-child-phone') return { label: 'Ikuti Instruksi', disabled: true }
    if (parentLookupAccount) {
      return { label: parentProfileTargetReady ? 'Review & Pilih Metode Bayar' : 'Tentukan Profil Tujuan', disabled: !parentProfileTargetReady }
    }
    if (lookupState === 'existing-old-account') {
      if (usesMappingDecision && contactOwner === null) {
        return { label: isOptionThree ? 'Pilih Posisi Data' : 'Pilih Pemilik Kontak', disabled: true }
      }

      return { label: migrationFormReady ? 'Review & Pilih Metode Bayar' : 'Lengkapi Data Migrasi', disabled: !migrationFormReady }
    }
    return { label: 'Pilih Status Akun', disabled: true }
  }, [accountStatus, childDataReady, childProfileFormReady, consent, contactOwner, isOptionThree, lookupState, migrationFormReady, newAccountFormReady, parentDataReady, parentLookupAccount, parentProfileTargetReady, profileTarget, selectedChildProfile, usesMappingDecision, wizardStep])

  const handleAccountStatusChange = (value: AccountStatus | null) => {
    setAccountStatus(value)
    setLookupState('idle')
    setPhone('')
    setUsesParentIdentity(false)
    setContactOwner(null)
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setParentPhone('')
    setParentName('')
    setChildName('')
    setChildPhone('')
    setChildEmail('')
    setGrade('')
    setWizardStep(1)
    setConsent(false)
  }

  const resetFlowState = () => {
    setAccountStatus(null)
    setLookupState('idle')
    setPhone('')
    setUsesParentIdentity(false)
    setContactOwner(null)
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setWizardStep(1)
    setParentPhone('')
    setParentName('')
    setChildName('')
    setChildPhone('')
    setChildEmail('')
    setGrade('')
    setReviewOpen(false)
    setDoneOpen(false)
    setConsent(false)
  }

  const handlePrototypeOptionChange = (option: PrototypeOptionId) => {
    setPrototypeOption(option)
    resetFlowState()

    const url = new URL(window.location.href)
    url.searchParams.set('option', option)
    window.history.pushState({}, '', url)
  }

  const checkNumber = () => {
    const normalizedPhone = phone.replace(/\D/g, '')

    setContactOwner(null)
    setProfileTarget(null)
    setSelectedChildProfileId('')
    setConsent(false)

    if (accountStatus === 'existing') {
      if (isParentAccountWithSingleChildPhone(phone)) {
        setLookupState('existing-parent-single-child')
        setProfileTarget('existing')
        setSelectedChildProfileId(parentAccountWithSingleChild.profiles[0]?.id ?? '')
        return
      }

      if (isParentAccountWithChildrenPhone(phone)) {
        setLookupState('existing-parent-with-children')
        setProfileTarget('existing')
        setSelectedChildProfileId(parentAccountWithChildren.profiles[0]?.id ?? '')
        return
      }

      if (isParentAccountWithoutChildrenPhone(phone)) {
        setLookupState('existing-parent-empty')
        setProfileTarget('new')
        return
      }

      if (isChildProfileContact(phone)) {
        setLookupState('existing-child-phone')
        return
      }

      if (normalizedPhone.includes('999')) {
        setLookupState('existing-not-registered')
        return
      }

      setLookupState('existing-old-account')
      return
    }

    if (isChildProfileContact(phone)) {
      setLookupState('new-available')
      return
    }

    if (
      normalizedPhone.includes('222')
      || isParentAccountWithSingleChildPhone(phone)
      || isParentAccountWithChildrenPhone(phone)
      || isParentAccountWithoutChildrenPhone(phone)
    ) {
      setLookupState('new-registered')
      return
    }

    setLookupState('new-available')
  }

  const handleBottomCtaClick = () => {
    if (!isOptionThree) {
      setReviewOpen(true)
      return
    }

    if (wizardStep === 1) {
      setWizardStep(accountStatus === 'new' ? 3 : 2)
      return
    }

    if (wizardStep === 2) {
      setWizardStep(parentLookupAccount ? (profileTarget === 'existing' ? 5 : 4) : 3)
      return
    }

    if (wizardStep === 3) {
      setWizardStep(4)
      return
    }

    if (wizardStep === 4) {
      setWizardStep(5)
      return
    }

    setDoneOpen(true)
  }

  return (
    <main className="app-shell">
      <section className="device-shell" aria-label="Prototype opsi 1">
        <AppChrome
          selected={prototypeOption}
          title={isOptionThree ? 'Tujuan Pembelian' : 'Draft Invoice'}
          onOptionChange={handlePrototypeOptionChange}
        />

        <div className="content-stack">
          {!isOptionThree && <OrderCard />}
          {prototypeOption === '1' || prototypeOption === '2' || prototypeOption === '3' ? (
            <PurchasePurposeCard
              accountStatus={accountStatus}
              childName={childName}
              consent={consent}
              contactOwner={contactOwner}
              checkNumber={checkNumber}
              grade={grade}
              isBeforeAfterMapping={isOptionThree}
              isExplicitMapping={isOptionTwo}
              lookupState={lookupState}
              setWizardStep={setWizardStep}
              childEmail={childEmail}
              childPhone={childPhone}
              profileTarget={profileTarget}
              selectedChildProfileId={selectedChildProfileId}
              parentName={parentName}
              parentPhone={parentPhone}
              phone={phone}
              setAccountStatus={handleAccountStatusChange}
              setChildEmail={setChildEmail}
              setConsent={setConsent}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setContactOwner={setContactOwner}
              setGrade={setGrade}
              setParentName={setParentName}
              setParentPhone={setParentPhone}
              setPhone={setPhone}
              setProfileTarget={setProfileTarget}
              setSelectedChildProfileId={setSelectedChildProfileId}
              setUsesParentIdentity={setUsesParentIdentity}
              showMigrationForm={showMigrationForm}
              showNewAccountForm={showNewAccountForm}
              usesParentIdentity={parentContactSelected}
              wizardStep={wizardStep}
            />
          ) : (
            <PrototypeConceptCard option={prototypeOptions.find((option) => option.id === prototypeOption) ?? prototypeOptions[0]} />
          )}
          {!isOptionThree && <DiscountCard />}
          {!isOptionThree && <PaymentDetailCard />}
        </div>

        <BottomCta
          contextLabel={isOptionThree ? `Tahap ${wizardStep}/5` : undefined}
          contextValue={isOptionThree ? getWizardStepTitle(wizardStep) : undefined}
          disabled={cta.disabled}
          label={cta.label}
          onClick={handleBottomCtaClick}
        />

        {reviewOpen && (
          <ReviewSheet
            accountStatus={accountStatus}
            consent={consent}
            lookupState={lookupState}
            phone={phone}
            childName={childName}
            grade={grade}
            parentName={effectiveParentName || parentName}
            parentPhone={effectiveParentPhone || parentPhone}
            profileTarget={profileTarget}
            selectedChildProfileId={selectedChildProfileId}
            setConsent={setConsent}
            usesParentIdentity={parentContactSelected}
            onClose={() => setReviewOpen(false)}
            onContinue={() => {
              setReviewOpen(false)
              setDoneOpen(true)
            }}
          />
        )}

        {doneOpen && <DoneSheet onClose={() => setDoneOpen(false)} />}

      </section>
    </main>
  )
}

function AppChrome({ selected, title = 'Draft Invoice', onOptionChange }: { selected: PrototypeOptionId; title?: string; onOptionChange: (option: PrototypeOptionId) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleOptionClick = (option: PrototypeOptionId) => {
    onOptionChange(option)
    setMenuOpen(false)
  }

  return (
    <header className="invoice-header compact-header">
      <button className="back-button" type="button" aria-label="Kembali">
        <ArrowLeft size={19} />
      </button>
      <h1>{title}</h1>
      <div className="prototype-menu">
        <button className="prototype-menu-trigger" type="button" aria-expanded={menuOpen} aria-label="Pilih opsi prototype" onClick={() => setMenuOpen(!menuOpen)}>
          <MoreVertical size={18} />
        </button>
        {menuOpen && (
          <div className="prototype-menu-popover" role="menu" aria-label="Opsi prototype">
            <span>Mode Prototype</span>
            {prototypeOptions.map((option) => (
              <button className={option.id === selected ? 'active' : ''} key={option.id} type="button" role="menuitem" onClick={() => handleOptionClick(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

function SectionCard({ children, className = '', title }: { children: ReactNode; className?: string; title: string }) {
  return (
    <section className={`card ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function StagePanel({ children, className = '', step, title }: { children: ReactNode; className?: string; step: string; title: string }) {
  return (
    <div className={`stage-block ${className}`.trim()}>
      <p className="stage-label">{step}</p>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function Callout({ children, className = '', icon, showIcon = true, variant = 'info' }: { children: ReactNode; className?: string; icon?: ReactNode; showIcon?: boolean; variant?: CalloutVariant }) {
  return (
    <div className={`callout ${variant} ${className}`.trim()}>
      {showIcon && (icon ?? <Info size={15} />)}
      <div>{children}</div>
    </div>
  )
}

function PointList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="point-list">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  )
}

function OrderCard() {
  return (
    <SectionCard className="order-card" title="Detail Pemesanan">
      <FieldBlock label="Nama Paket">
        <p>ruangbelajar SMA/SMK 1 Tahun</p>
      </FieldBlock>
      <FieldBlock label="Deskripsi">
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <IconText icon={<CheckCircle2 size={13} />} key={benefit}>{benefit}</IconText>
          ))}
        </div>
      </FieldBlock>
      <PriceLine />
    </SectionCard>
  )
}

function FieldBlock({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="field-block">
      <h3>{label}</h3>
      {children}
    </div>
  )
}

function IconText({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="icon-text">
      {icon}
      <span>{children}</span>
    </div>
  )
}

function PriceLine() {
  return (
    <div className="price-line">
      <span className="discount-badge">Diskon 60%</span>
      <div>
        <del>Rp1.200.000</del>
        <strong>Rp889.000</strong>
      </div>
    </div>
  )
}

function PrototypeConceptCard({ option }: { option: typeof prototypeOptions[number] }) {
  return (
    <SectionCard className="concept-card" title={option.title}>
      <Callout>
        <strong>Konsep belum dibangun</strong>
        <PointList items={option.steps} />
      </Callout>
      <div className="concept-flow">
        {option.steps.map((step, index) => (
          <div className="concept-step" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function PurchasePurposeCard({
  accountStatus,
  checkNumber,
  childEmail,
  childName,
  childPhone,
  consent,
  contactOwner,
  grade,
  isBeforeAfterMapping,
  isExplicitMapping,
  lookupState,
  parentName,
  parentPhone,
  phone,
  profileTarget,
  selectedChildProfileId,
  setAccountStatus,
  setChildEmail,
  setChildName,
  setChildPhone,
  setConsent,
  setContactOwner,
  setGrade,
  setParentName,
  setParentPhone,
  setPhone,
  setProfileTarget,
  setSelectedChildProfileId,
  setUsesParentIdentity,
  setWizardStep,
  showMigrationForm,
  showNewAccountForm,
  usesParentIdentity,
  wizardStep,
}: PurchasePurposeCardProps) {
  const parentLookupAccount = getLookupParentAccount(lookupState)

  if (isBeforeAfterMapping) {
    return (
      <SectionCard className="purpose-card wizard-card" title="Tentukan Tujuan Pembelian Paket">
        <OptionThreeWizard
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          childEmail={childEmail}
          childName={childName}
          childPhone={childPhone}
          consent={consent}
          contactOwner={contactOwner}
          grade={grade}
          lookupState={lookupState}
          parentName={parentName}
          parentPhone={parentPhone}
          phone={phone}
          profileTarget={profileTarget}
          selectedChildProfileId={selectedChildProfileId}
          setAccountStatus={setAccountStatus}
          setChildEmail={setChildEmail}
          setChildName={setChildName}
          setChildPhone={setChildPhone}
          setConsent={setConsent}
          setContactOwner={setContactOwner}
          setGrade={setGrade}
          setParentName={setParentName}
          setParentPhone={setParentPhone}
          setPhone={setPhone}
          setProfileTarget={setProfileTarget}
          setSelectedChildProfileId={setSelectedChildProfileId}
          setWizardStep={setWizardStep}
          showNewAccountForm={showNewAccountForm}
          usesParentIdentity={usesParentIdentity}
          wizardStep={wizardStep}
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard className="purpose-card" title="Tujuan Pembelian Paket">
      <StagePanel step="TAHAP 1" title="Pilih Status Kepemilikan Akun">
        <ChoiceCard
          active={accountStatus === 'existing'}
          description="Orang tua/anak sudah pernah memiliki akun, ingin renew paket atau berlangganan sebelumnya"
          title="Sudah Punya Akun"
          onClick={() => setAccountStatus('existing')}
        />
        <ChoiceCard
          active={accountStatus === 'new'}
          description="Orang tua/anak belum pernah memiliki akun atau berlangganan sebelumnya"
          title="Belum Punya Akun"
          onClick={() => setAccountStatus('new')}
        />
      </StagePanel>

      <LookupStage
        accountStatus={accountStatus}
        checkNumber={checkNumber}
        lookupState={lookupState}
        phone={phone}
        setAccountStatus={setAccountStatus}
        contactOwner={contactOwner}
        isBeforeAfterMapping={false}
        isExplicitMapping={isExplicitMapping}
        setContactOwner={setContactOwner}
        setPhone={setPhone}
        setUsesParentIdentity={setUsesParentIdentity}
        usesParentIdentity={usesParentIdentity}
      />

      {parentLookupAccount && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Profil Tujuan Aktivasi Paket">
          <ProfileTargetStage
            account={parentLookupAccount}
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            profileTarget={profileTarget}
            selectedChildProfileId={selectedChildProfileId}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
            setProfileTarget={setProfileTarget}
            setSelectedChildProfileId={setSelectedChildProfileId}
          />
        </StagePanel>
      )}

      {showMigrationForm && (
        <>
          {!isExplicitMapping && (
            <Callout variant="warning">
              <strong>{usesParentIdentity ? 'Kontak akun lama milik orang tua' : 'Kontak akun lama milik anak'}</strong>
              <PointList items={usesParentIdentity ? [
                'No. HP akun lama dipakai sebagai Data Orang Tua.',
                'Lengkapi Profil Anak sebagai penerima paket.',
                'Login anak berubah ke Username dan PIN.',
              ] : [
                'Akun lama dikonversi menjadi Profil Anak.',
                'Isi Data Orang Tua sebagai akun pengelola.',
                'Login anak berubah ke Username dan PIN.',
              ]} />
            </Callout>
          )}

          {isExplicitMapping && contactOwner && <MigrationStateSummary contactOwner={contactOwner} phone={phone} />}

          <StagePanel className="form-stage" step="TAHAP 3" title="Lengkapi Data Akun Orang Tua dan Profil Anak">
            <AccountForm
              childEmail={childEmail || (usesParentIdentity ? '' : existingAccount.email)}
              childName={childName || (usesParentIdentity ? '' : existingAccount.name)}
              childPhone={childPhone || (usesParentIdentity ? '' : phone)}
              grade={grade}
              mode="migration"
              parentName={parentName}
              parentPhone={usesParentIdentity ? parentPhone || phone : parentPhone}
              usesParentIdentity={usesParentIdentity}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              setParentName={setParentName}
              setParentPhone={setParentPhone}
            />
          </StagePanel>
        </>
      )}

      {showNewAccountForm && (
        <StagePanel className="form-stage" step="TAHAP 3" title="Buat Akun Orang Tua dan Profil Anak">
          <AccountForm
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            mode="new"
            parentName={parentName}
            parentPhone={parentPhone || phone}
            usesParentIdentity={false}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
            setParentName={setParentName}
            setParentPhone={setParentPhone}
          />
        </StagePanel>
      )}
    </SectionCard>
  )
}

function OptionThreeWizard({
  accountStatus,
  checkNumber,
  childEmail,
  childName,
  childPhone,
  consent,
  contactOwner,
  grade,
  lookupState,
  parentName,
  parentPhone,
  phone,
  profileTarget,
  selectedChildProfileId,
  setAccountStatus,
  setChildEmail,
  setChildName,
  setChildPhone,
  setConsent,
  setContactOwner,
  setGrade,
  setParentName,
  setParentPhone,
  setPhone,
  setProfileTarget,
  setSelectedChildProfileId,
  setWizardStep,
  showNewAccountForm,
  usesParentIdentity,
  wizardStep,
}: OptionThreeWizardProps) {
  const goBack = () => setWizardStep(Math.max(1, wizardStep - 1) as WizardStep)
  const isNewAccount = accountStatus === 'new' && showNewAccountForm
  const parentLookupAccount = getLookupParentAccount(lookupState)

  return (
    <>
      <MigrationStageStepper wizardStep={wizardStep} />
      {wizardStep > 1 && <WizardBackButton onClick={goBack} />}

      {wizardStep === 1 && (
        <WizardLookupStep
          accountStatus={accountStatus}
          checkNumber={checkNumber}
          lookupState={lookupState}
          phone={phone}
          setAccountStatus={setAccountStatus}
          setPhone={setPhone}
        />
      )}

      {wizardStep === 2 && (
        <StagePanel step="STEP 2" title="Tentukan Tujuan Paket">
          {parentLookupAccount ? (
            <ProfileTargetStage
              account={parentLookupAccount}
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              profileTarget={profileTarget}
              selectedChildProfileId={selectedChildProfileId}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              setProfileTarget={setProfileTarget}
              setSelectedChildProfileId={setSelectedChildProfileId}
            />
          ) : (
            <BeforeAfterMappingPanel contactOwner={contactOwner} phone={phone} setContactOwner={setContactOwner} />
          )}
        </StagePanel>
      )}

      {wizardStep === 3 && (
        <StagePanel className="form-stage" step="STEP 3" title={isNewAccount ? 'Buat Akun Orang Tua' : 'Lengkapi Data Orang Tua'}>
          <ParentDataStep
            mode={isNewAccount ? 'new' : 'migration'}
            parentName={parentName}
            parentPhone={usesParentIdentity ? parentPhone || phone : parentPhone}
            setParentName={setParentName}
            setParentPhone={setParentPhone}
            usesParentIdentity={usesParentIdentity}
          />
        </StagePanel>
      )}

      {wizardStep === 4 && (
        <StagePanel className="form-stage" step="STEP 4" title={parentLookupAccount ? 'Buat Profil Anak Baru' : 'Lengkapi Profil Anak'}>
          {parentLookupAccount ? (
            <NewChildProfileForm
              childEmail={childEmail}
              childName={childName}
              childPhone={childPhone}
              grade={grade}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
            />
          ) : (
            <ChildProfileStep
              childEmail={childEmail || (usesParentIdentity || isNewAccount ? '' : existingAccount.email)}
              childName={childName || (usesParentIdentity || isNewAccount ? '' : existingAccount.name)}
              childPhone={childPhone || (usesParentIdentity || isNewAccount ? '' : phone)}
              grade={grade}
              isMigration={!isNewAccount}
              setChildEmail={setChildEmail}
              setChildName={setChildName}
              setChildPhone={setChildPhone}
              setGrade={setGrade}
              usesParentIdentity={usesParentIdentity}
            />
          )}
        </StagePanel>
      )}

      {wizardStep === 5 && (
        <StagePanel step="STEP 5" title="Review Tujuan Paket dan Persetujuan">
          <WizardReviewStep
            accountStatus={accountStatus}
            childName={childName}
            consent={consent}
            grade={grade}
            parentAccount={parentLookupAccount}
            parentName={parentName}
            parentPhone={parentLookupAccount?.phone ?? (usesParentIdentity ? parentPhone || phone : parentPhone)}
            phone={phone}
            profileTarget={profileTarget}
            selectedChildProfileId={selectedChildProfileId}
            setConsent={setConsent}
            usesParentIdentity={usesParentIdentity}
          />
        </StagePanel>
      )}
    </>
  )
}

type PurchasePurposeCardProps = {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  childEmail: string
  childName: string
  childPhone: string
  consent: boolean
  grade: string
  lookupState: LookupState
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  setAccountStatus: (value: AccountStatus | null) => void
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setConsent: (value: boolean) => void
  setGrade: (value: string) => void
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
  setPhone: (value: string) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
  setContactOwner: (value: ContactOwner) => void
  setUsesParentIdentity: (value: boolean) => void
  setWizardStep: (value: WizardStep) => void
  showMigrationForm: boolean
  showNewAccountForm: boolean
  usesParentIdentity: boolean
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  wizardStep: WizardStep
}

type OptionThreeWizardProps = Omit<PurchasePurposeCardProps, 'isBeforeAfterMapping' | 'isExplicitMapping' | 'setUsesParentIdentity' | 'showMigrationForm'>

type StepperState = 'active' | 'done' | 'pending'

function MigrationStageStepper({ wizardStep }: { wizardStep: WizardStep }) {
  const steps: Array<{ label: string; state: StepperState }> = [
    { label: 'Cari', state: wizardStep > 1 ? 'done' : 'active' },
    { label: 'Tujuan', state: wizardStep > 2 ? 'done' : wizardStep === 2 ? 'active' : 'pending' },
    { label: 'Ortu', state: wizardStep > 3 ? 'done' : wizardStep === 3 ? 'active' : 'pending' },
    { label: 'Anak', state: wizardStep > 4 ? 'done' : wizardStep === 4 ? 'active' : 'pending' },
    { label: 'Review', state: wizardStep === 5 ? 'active' : 'pending' },
  ]

  return (
    <nav className="stage-stepper" aria-label="Tahap migrasi akun">
      {steps.map((step, index) => (
        <div className={`stage-step ${step.state}`} key={step.label}>
          <span>{step.state === 'done' ? <Check size={12} /> : index + 1}</span>
          <strong>{step.label}</strong>
        </div>
      ))}
    </nav>
  )
}

function WizardBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="wizard-back" type="button" onClick={onClick}>
      <ArrowLeft size={14} />
      Kembali
    </button>
  )
}

function WizardLookupStep({ accountStatus, checkNumber, lookupState, phone, setAccountStatus, setPhone }: {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  lookupState: LookupState
  phone: string
  setAccountStatus: (value: AccountStatus | null) => void
  setPhone: (value: string) => void
}) {
  const isExistingFlow = accountStatus === 'existing'

  return (
    <StagePanel step="STEP 1" title="Cari Customer dan Status Akun">
      <ChoiceCard
        active={accountStatus === 'existing'}
        description="Cek akun customer untuk menentukan tujuan paket dan kebutuhan konversi."
        title="Sudah Punya Akun"
        onClick={() => setAccountStatus('existing')}
      />
      <ChoiceCard
        active={accountStatus === 'new'}
        description="Customer belum punya akun Ruangguru. Lewati mapping dan buat struktur baru."
        title="Belum Punya Akun"
        onClick={() => setAccountStatus('new')}
      />

      {accountStatus && (
        <div className="wizard-lookup-area">
          <div className="lookup-row">
            <input
              value={phone}
              placeholder="Contoh: 0856342565342"
              onChange={(event) => setPhone(event.target.value)}
              aria-label={isExistingFlow ? 'Nomor HP akun lama' : 'Nomor HP orang tua'}
            />
            <button type="button" onClick={checkNumber}>Cek Nomor</button>
          </div>

          {lookupState === 'idle' && (
            <Callout className="lookup-hint">
              <strong>Arahan untuk Agent</strong>
              <p>{isExistingFlow ? 'Input No. HP yang melekat ke akun lama. Setelah akun ditemukan, lanjutkan ke tahap mapping.' : 'Input No. HP orang tua yang akan menjadi Master Account.'}</p>
            </Callout>
          )}
          {lookupState === 'existing-old-account' && (
            <>
              <Callout icon={<CheckCircle2 size={16} />} variant="success">
                <strong>Akun lama ditemukan. Lanjutkan ke tahap mapping.</strong>
              </Callout>
              <AccountResult name={existingAccount.name} phone={phone} />
            </>
          )}
          {isParentProfileLookup(lookupState) && <ParentAccountResult account={getLookupParentAccount(lookupState)!} />}
          {lookupState === 'existing-not-registered' && <ExistingNotRegistered setAccountStatus={setAccountStatus} />}
          {lookupState === 'existing-child-phone' && <ExistingChildPhone setAccountStatus={setAccountStatus} />}
          {lookupState === 'new-available' && <NewAvailableAccount isChildContact={isChildProfileContact(phone)} phone={phone} />}
          {lookupState === 'new-registered' && <NewRegisteredAccount phone={phone} setAccountStatus={setAccountStatus} />}
        </div>
      )}
    </StagePanel>
  )
}

function ParentDataStep({ mode, parentName, parentPhone, setParentName, setParentPhone, usesParentIdentity }: {
  mode: 'migration' | 'new'
  parentName: string
  parentPhone: string
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
  usesParentIdentity: boolean
}) {
  const shouldCheckParentPhone = mode === 'migration' && !usesParentIdentity
  const parentPhoneAccount = shouldCheckParentPhone ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsCheckable = shouldCheckParentPhone && canCheckParentPhone(parentPhone)
  const shouldPrefillParentName = Boolean(parentPhoneAccount && !parentName)
  const parentNameValue = shouldPrefillParentName ? parentPhoneAccount?.name ?? '' : parentName

  return (
    <div className="form-fields compact-form">
      <TextField
        helper={usesParentIdentity ? 'Otomatis terisi dari No. HP akun lama yang hanya melekat ke satu akun.' : undefined}
        label="No. HP Orang Tua"
        placeholder="Masukan no. HP orang tua"
        value={parentPhone}
        onChange={setParentPhone}
      />
      {shouldCheckParentPhone && parentPhoneIsCheckable && (
        <ParentPhoneCheckResult account={parentPhoneAccount} phone={parentPhone} />
      )}
      <TextField
        helper={shouldPrefillParentName ? 'Otomatis terisi dari akun yang ditemukan melalui No. HP Orang Tua.' : undefined}
        label="Nama Orang Tua"
        placeholder="Masukan nama lengkap orang tua"
        readOnly={shouldPrefillParentName}
        value={parentNameValue}
        onChange={setParentName}
      />
    </div>
  )
}

function ChildProfileStep({ childEmail, childName, childPhone, grade, isMigration, setChildEmail, setChildName, setChildPhone, setGrade, usesParentIdentity }: {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  isMigration: boolean
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
  usesParentIdentity: boolean
}) {
  return (
    <div className="form-fields compact-form">
      <TextField label="Nama Lengkap Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak, bukan akses login utama. Nomor boleh sama dengan milik orang tua."
        label="No. HP Anak"
        placeholder="Masukan no. HP anak (opsional)"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak, bukan akses login utama. Email boleh sama dengan milik orang tua."
        label="Email Anak"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout className="strong">
        <strong>Yang perlu diberitahu</strong>
        <PointList items={[
          isMigration ? (usesParentIdentity ? 'Profil Anak dibuat dari data yang agent isi.' : 'Akun lama akan berubah menjadi Profil Anak.') : 'Profil Anak baru dibuat di bawah Akun Orang Tua.',
          <>No. HP dan Email anak <strong>tidak bisa digunakan login</strong>.</>,
          'Username dan PIN dikirim ke WhatsApp Orang Tua setelah transaksi berhasil.',
        ]} />
      </Callout>
    </div>
  )
}

function NewChildProfileForm({ childEmail, childName, childPhone, grade, setChildEmail, setChildName, setChildPhone, setGrade }: {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
}) {
  return (
    <div className="form-fields compact-form">
      <TextField label="Nama Lengkap Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak. Nomor boleh sama dengan milik orang tua."
        label="No. HP Anak"
        placeholder="Masukan no. HP anak (opsional)"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak dan tidak bisa digunakan login."
        label="Email Anak"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout>
        <strong>Setelah transaksi berhasil</strong>
        <PointList items={[
          'Profil Anak baru dibuat di bawah Akun Orang Tua yang ditemukan.',
          'Username dan PIN anak dikirim ke WhatsApp Orang Tua.',
        ]} />
      </Callout>
    </div>
  )
}

function WizardReviewStep({ accountStatus, childName, consent, grade, parentAccount, parentName, parentPhone, phone, profileTarget, selectedChildProfileId, setConsent, usesParentIdentity }: {
  accountStatus: AccountStatus | null
  childName: string
  consent: boolean
  grade: string
  parentAccount: ParentProfileAccount | null
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  setConsent: (value: boolean) => void
  usesParentIdentity: boolean
}) {
  const isNewAccount = accountStatus === 'new'
  const selectedProfile = parentAccount?.profiles.find((profile) => profile.id === selectedChildProfileId)
  const parentLabel = usesParentIdentity ? parentName || 'Orang tua dari data akun lama' : parentName || 'Orang tua'
  const parentNumberLabel = usesParentIdentity ? phone : parentPhone || phone || 'yang diisi agent'
  const parentDisplayName = parentAccount?.name ?? parentLabel
  const parentDisplayPhone = parentAccount?.phone ?? parentNumberLabel
  const targetProfileName = parentAccount
    ? profileTarget === 'existing' && selectedProfile
      ? selectedProfile.name
      : childName || 'Profil Anak baru'
    : isNewAccount || usesParentIdentity
      ? childName || 'Profil Anak baru'
      : existingAccount.name
  const targetGrade = parentAccount && profileTarget === 'existing' && selectedProfile ? selectedProfile.grade : grade || '-'
  const usesExistingProfile = Boolean(parentAccount && profileTarget === 'existing' && selectedProfile)
  const reviewType = parentAccount ? 'Aktivasi paket' : isNewAccount ? 'Pembuatan akun' : 'Konversi akun'
  const reviewNote = parentAccount
    ? usesExistingProfile
      ? 'Paket akan aktif di profil yang dipilih. Akses profil tidak berubah.'
      : 'Profil baru akan dibuat sebelum paket diaktifkan.'
    : isNewAccount
      ? 'Struktur Akun Orang Tua dan Profil Anak baru akan dibuat.'
      : 'Akun lama akan disesuaikan ke struktur baru.'
  const accessValue = usesExistingProfile ? 'Tidak berubah' : 'Username + PIN'
  const accessCopy = usesExistingProfile ? 'Gunakan akses profil yang sudah ada.' : parentAccount || isNewAccount ? 'Username dan PIN dikirim ke WhatsApp Orang Tua.' : 'Login anak berubah ke Username dan PIN.'
  const consentCopy = usesExistingProfile ? 'Tujuan paket sudah dikonfirmasi ke customer.' : 'Perubahan akses login dan pemrosesan data sudah dijelaskan ke customer.'

  return (
    <div className="wizard-review scan-review">
      <section className="review-hero" aria-label="Ringkasan tujuan paket">
        <span>{reviewType}</span>
        <strong>{targetProfileName}</strong>
        <p>{reviewNote}</p>
      </section>

      <div className="review-facts" aria-label="Detail review">
        <ReviewFact label="Akun Orang Tua" value={parentDisplayName} meta={parentDisplayPhone} />
        <ReviewFact label="Profil Tujuan" value={targetProfileName} meta={targetGrade} />
        <ReviewFact label="Akses Anak" value={accessValue} meta={accessCopy} />
      </div>

      <section className="review-checklist" aria-label="Yang perlu dipastikan">
        <h4>Pastikan sebelum lanjut</h4>
        <ReviewCheckItem>Profil tujuan paket sudah sesuai dengan customer.</ReviewCheckItem>
        {selectedProfile?.hasActivePackage && <ReviewCheckItem warning>Profil ini sudah punya paket aktif. Konfirmasi renewal atau upgrade.</ReviewCheckItem>}
        {usesExistingProfile ? <ReviewCheckItem>Akses profil anak tetap mengikuti pengaturan yang sudah ada.</ReviewCheckItem> : <ReviewCheckItem>No. HP/email anak hanya tersimpan sebagai data profil.</ReviewCheckItem>}
      </section>

      <label className="consent-row review-consent">
        <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
        <span>{consentCopy}</span>
      </label>
    </div>
  )
}

function ReviewFact({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="review-fact">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  )
}

function ReviewCheckItem({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <div className={warning ? 'review-check warning' : 'review-check'}>
      {warning ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      <span>{children}</span>
    </div>
  )
}

function ChoiceCard({ active = false, description, onClick, title }: { active?: boolean; description: string; onClick: () => void; title: string }) {
  return (
    <button className={active ? 'choice-card active' : 'choice-card'} type="button" onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span className="radio-dot" />
    </button>
  )
}

function ParentAccountResult({ account }: { account: ParentProfileAccount }) {
  const hasProfiles = account.profiles.length > 0
  const hasActivePackage = account.profiles.some((profile) => profile.hasActivePackage)
  const profileCopy = account.profiles.length > 1 ? `${account.profiles.length} Profil Anak ditemukan.` : '1 Profil Anak ditemukan.'

  return (
    <>
      <Callout icon={<CheckCircle2 size={16} />} variant="success">
        <strong>Akun Orang Tua ditemukan</strong>
        <p>{hasProfiles ? `${profileCopy} Pilih profil tujuan aktivasi paket di tahap berikutnya.` : 'Akun ini belum punya Profil Anak. Buat profil baru untuk aktivasi paket.'}</p>
      </Callout>
      <AccountResult name={account.name} phone={account.phone} />
      <Callout variant={hasActivePackage ? 'warning' : 'info'}>
        <strong>Rekomendasi aksi</strong>
        <PointList items={hasProfiles ? [
          'Konfirmasi nama anak yang akan menerima paket.',
          'Jika anak belum ada di daftar, pilih Buat Profil Baru.',
          hasActivePackage ? 'Jika profil sudah punya paket aktif, konfirmasi apakah transaksi ini untuk renewal atau upgrade.' : 'Lanjutkan jika profil tujuan sudah benar.',
        ] : [
          'Minta nama dan kelas anak.',
          'Buat Profil Anak baru di bawah akun orang tua ini.',
        ]} />
      </Callout>
    </>
  )
}

function ProfileTargetStage({ account, childEmail, childName, childPhone, grade, profileTarget, selectedChildProfileId, setChildEmail, setChildName, setChildPhone, setGrade, setProfileTarget, setSelectedChildProfileId }: {
  account: ParentProfileAccount
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
  setProfileTarget: (value: ProfileTarget) => void
  setSelectedChildProfileId: (value: string) => void
}) {
  const selectedProfile = account.profiles.find((profile) => profile.id === selectedChildProfileId)
  const hasProfiles = account.profiles.length > 0

  const selectExistingProfile = (profile: ChildProfile) => {
    setProfileTarget('existing')
    setSelectedChildProfileId(profile.id)
  }

  const selectNewProfile = () => {
    setProfileTarget('new')
    setSelectedChildProfileId('')
  }

  return (
    <div className="profile-target-stage">
      <div className="state-summary parent-summary" aria-label="Ringkasan akun orang tua">
        <div>
          <span>Akun Orang Tua</span>
          <strong>{account.name}</strong>
          <small>{account.phone}</small>
        </div>
        <div>
          <span>Status Profil Anak</span>
          <strong>{hasProfiles ? `${account.profiles.length} profil tersedia` : 'Belum ada profil'}</strong>
          <small>{hasProfiles ? 'Pilih profil yang akan menerima paket.' : 'Buat profil baru untuk anak.'}</small>
        </div>
      </div>

      <p className="stage-description">Paket hanya aktif di satu profil anak. Pastikan tujuan paket sesuai dengan anak yang disebut customer.</p>

      <div className="profile-option-list">
        {account.profiles.map((profile) => (
          <ProfileTargetRow
            active={profileTarget === 'existing' && selectedChildProfileId === profile.id}
            key={profile.id}
            profile={profile}
            onClick={() => selectExistingProfile(profile)}
          />
        ))}
        <button className={profileTarget === 'new' ? 'profile-target-row add active' : 'profile-target-row add'} type="button" onClick={selectNewProfile}>
          <span className="profile-plus"><Plus size={18} /></span>
          <div>
            <strong>Buat Profil Baru</strong>
            <small>{hasProfiles ? 'Gunakan jika anak belum ada di daftar.' : 'Wajib dibuat sebelum paket diaktifkan.'}</small>
          </div>
          <span className="profile-radio" />
        </button>
      </div>

      {selectedProfile?.hasActivePackage && (
        <Callout variant="warning">
          <strong>Profil ini sudah punya paket aktif</strong>
          <PointList items={[
            'Konfirmasi transaksi ini untuk renewal, upgrade, atau pembelian paket lain.',
            'Jika bukan untuk profil ini, pilih profil lain atau buat Profil Baru.',
          ]} />
        </Callout>
      )}

      {profileTarget === 'new' && (
        <div className="new-profile-inline">
          <h4>Data Profil Anak Baru</h4>
          <NewChildProfileForm
            childEmail={childEmail}
            childName={childName}
            childPhone={childPhone}
            grade={grade}
            setChildEmail={setChildEmail}
            setChildName={setChildName}
            setChildPhone={setChildPhone}
            setGrade={setGrade}
          />
        </div>
      )}
    </div>
  )
}

function ProfileTargetRow({ active, onClick, profile }: { active: boolean; onClick: () => void; profile: ChildProfile }) {
  return (
    <button className={active ? 'profile-target-row active' : 'profile-target-row'} type="button" onClick={onClick}>
      <span className="profile-avatar" aria-hidden="true">{profile.name.charAt(0)}</span>
      <div>
        <strong>{profile.name}</strong>
        <small>{profile.grade}</small>
        {profile.hasActivePackage && <em>Paket aktif</em>}
      </div>
      <span className="profile-radio" />
    </button>
  )
}

function LookupStage({
  accountStatus,
  checkNumber,
  contactOwner,
  isBeforeAfterMapping,
  isExplicitMapping,
  lookupState,
  phone,
  setAccountStatus,
  setContactOwner,
  setPhone,
  setUsesParentIdentity,
  usesParentIdentity,
}: {
  accountStatus: AccountStatus | null
  checkNumber: () => void
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  lookupState: LookupState
  phone: string
  setAccountStatus: (value: AccountStatus | null) => void
  setContactOwner: (value: ContactOwner) => void
  setPhone: (value: string) => void
  setUsesParentIdentity: (value: boolean) => void
  usesParentIdentity: boolean
}) {
  if (!accountStatus) {
    return (
      <StagePanel className="divided muted-stage" step="TAHAP 2" title="Pilih status akun terlebih dahulu">
        <Callout className="lookup-hint">
          <strong>Arahan untuk Agent</strong>
          <p>Pilih salah satu status di Tahap 1 agar sistem tahu apakah nomor yang dicek adalah akun lama atau akun orang tua baru.</p>
        </Callout>
      </StagePanel>
    )
  }

  const isExistingFlow = accountStatus === 'existing'
  const title = isExistingFlow ? 'Masukkan no. HP yang tertera di Akun' : 'Masukkan no. HP Orang Tua'

  return (
    <StagePanel className="divided" step="TAHAP 2" title={title}>
      <div className="lookup-row">
        <input
          value={phone}
          placeholder="Contoh: 0856342565342"
          onChange={(event) => setPhone(event.target.value)}
          aria-label={isExistingFlow ? 'Nomor HP akun' : 'Nomor HP orang tua'}
        />
        <button type="button" onClick={checkNumber}>Cek Nomor</button>
      </div>
      {lookupState === 'idle' && (
        <Callout className="lookup-hint">
          <strong>Arahan untuk Agent</strong>
          <p>{isExistingFlow ? 'Input nomor yang dipakai customer untuk akun Ruangguru. Jika yang disebut adalah nomor anak, minta nomor login akun atau nomor orang tua.' : 'Input nomor orang tua yang akan menjadi Master Account. Sistem akan memastikan nomor ini belum terdaftar sebagai akun.'}</p>
        </Callout>
      )}
      {lookupState === 'existing-old-account' && (
        <FoundAccount
          contactOwner={contactOwner}
          isBeforeAfterMapping={isBeforeAfterMapping}
          isExplicitMapping={isExplicitMapping}
          phone={phone}
          setContactOwner={setContactOwner}
          setUsesParentIdentity={setUsesParentIdentity}
          usesParentIdentity={usesParentIdentity}
        />
      )}
      {isParentProfileLookup(lookupState) && <ParentAccountResult account={getLookupParentAccount(lookupState)!} />}
      {lookupState === 'existing-not-registered' && <ExistingNotRegistered setAccountStatus={setAccountStatus} />}
      {lookupState === 'existing-child-phone' && <ExistingChildPhone setAccountStatus={setAccountStatus} />}
      {lookupState === 'new-available' && <NewAvailableAccount isChildContact={isChildProfileContact(phone)} phone={phone} />}
      {lookupState === 'new-registered' && <NewRegisteredAccount phone={phone} setAccountStatus={setAccountStatus} />}
    </StagePanel>
  )
}

function FoundAccount({
  contactOwner,
  isBeforeAfterMapping,
  isExplicitMapping,
  phone,
  setContactOwner,
  setUsesParentIdentity,
  usesParentIdentity,
}: {
  contactOwner: ContactOwner
  isBeforeAfterMapping: boolean
  isExplicitMapping: boolean
  phone: string
  setContactOwner: (value: ContactOwner) => void
  setUsesParentIdentity: (value: boolean) => void
  usesParentIdentity: boolean
}) {
  if (isBeforeAfterMapping) {
    return <BeforeAfterMappingPanel contactOwner={contactOwner} phone={phone} setContactOwner={setContactOwner} />
  }

  if (isExplicitMapping) {
    return (
      <>
        <AccountResult name={existingAccount.name} phone={phone} />
        <div className="mapping-decision">
          <h3 className="small-title">Akun ditemukan</h3>
          <p className="decision-caption">Tentukan kontak akun lama masuk ke data siapa.</p>
          <div className="segmented-control" role="radiogroup" aria-label="Kontak akun lama dipakai untuk">
            <button
              className={contactOwner === 'child' ? 'segment-button active' : 'segment-button'}
              type="button"
              aria-pressed={contactOwner === 'child'}
              onClick={() => setContactOwner('child')}
            >
              <span>Profil Anak</span>
              <small>Prefill data anak</small>
            </button>
            <button
              className={contactOwner === 'parent' ? 'segment-button active' : 'segment-button'}
              type="button"
              aria-pressed={contactOwner === 'parent'}
              onClick={() => setContactOwner('parent')}
            >
              <span>Data Orang Tua</span>
              <small>Prefill no. HP</small>
            </button>
          </div>
        </div>
        <Callout variant={contactOwner === 'parent' ? 'warning' : 'info'}>
          <strong>{contactOwner ? 'Dampak pilihan' : 'Aksi berikutnya'}</strong>
          <PointList items={contactOwner === 'parent' ? [
            'No. HP akun lama otomatis masuk Data Orang Tua.',
            'Isi Profil Anak secara manual sebagai penerima paket.',
            'Pilihan ini tidak berarti akun lama digunakan oleh orang tua.',
          ] : contactOwner === 'child' ? [
            'Nama, No. HP, dan Email akun lama otomatis masuk Profil Anak.',
            'Isi atau cek No. HP Orang Tua sebagai Master Account.',
            'Profil Anak tetap tidak bisa login dengan No. HP/email.',
          ] : [
            'Pilih Profil Anak jika No. HP/email akun lama adalah milik siswa.',
            'Pilih Data Orang Tua jika No. HP/email akun lama adalah milik orang tua.',
          ]} />
        </Callout>
      </>
    )
  }

  return (
    <>
      <AccountResult name={existingAccount.name} phone={phone} />
      <h3 className="small-title">Akun ditemukan</h3>
      <ToggleRow checked={usesParentIdentity} label="Akun ini menggunakan No. HP atau email orang tua" onClick={() => setUsesParentIdentity(!usesParentIdentity)} />
      {usesParentIdentity && (
        <Callout variant="warning">
          <strong>Konsekuensi toggle aktif</strong>
          <PointList items={[
            'No. HP/email akun ' + existingAccount.name + ' dipakai sebagai Data Orang Tua.',
            'Toggle ini hanya menandai kontak orang tua, bukan siapa yang memakai akun.',
          ]} />
        </Callout>
      )}
      <Callout>
        <strong>Arahan untuk Agent</strong>
        {usesParentIdentity ? (
          <PointList items={[
            'Konfirmasi No. HP/email akun adalah milik orang tua.',
            'Jika bukan, matikan toggle dan isi Data Orang Tua manual.',
          ]} />
        ) : (
          <PointList items={[
            'Biarkan toggle mati jika data akun adalah data anak.',
            'Lanjutkan dengan mengisi Data Orang Tua dan Profil Anak.',
          ]} />
        )}
      </Callout>
    </>
  )
}

function BeforeAfterMappingPanel({ contactOwner, phone, setContactOwner }: {
  contactOwner: ContactOwner
  phone: string
  setContactOwner: (value: ContactOwner) => void
}) {
  return (
    <>
      <div className="structure-map" aria-label="Struktur sebelum dan sesudah migrasi">
        <div className="structure-panel before">
          <span>Sebelum migrasi</span>
          <strong>1 akun lama</strong>
          <AccountResult name={existingAccount.name} phone={phone} />
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{existingAccount.email}</dd>
            </div>
          </dl>
        </div>

        <div className="structure-transform">Diubah menjadi</div>

        <div className="structure-panel after">
          <span>Sesudah migrasi</span>
          <strong>Akun Orang Tua + Profil Anak</strong>
          <div className="target-stack">
            <StructureTargetButton
              active={contactOwner === 'parent'}
              description="No. HP akun lama menjadi kontak utama orang tua."
              label="Pilih"
              title="Akun Orang Tua"
              onClick={() => setContactOwner('parent')}
            />
            <StructureTargetButton
              active={contactOwner === 'child'}
              description="Nama, No. HP, dan Email akun lama menjadi data profil anak."
              label="Pilih"
              title="Profil Anak"
              onClick={() => setContactOwner('child')}
            />
          </div>
        </div>
      </div>

      <Callout variant={contactOwner === 'parent' ? 'warning' : 'info'}>
        <strong>{contactOwner ? 'Dampak migrasi' : 'Aksi berikutnya'}</strong>
        <PointList items={contactOwner === 'parent' ? [
          'Akun Orang Tua memakai No. HP akun lama.',
          'Profil Anak dibuat dari data yang agent isi di tahap berikutnya.',
          'Username dan PIN anak dikirim ke WhatsApp Orang Tua setelah transaksi berhasil.',
        ] : contactOwner === 'child' ? [
          'Akun lama berubah menjadi Profil Anak penerima paket.',
          'Agent tetap perlu mengisi atau mengecek No. HP Orang Tua sebagai Master Account.',
          'No. HP/email anak tersimpan sebagai data profil, bukan akses login.',
        ] : [
          'Pilih Akun Orang Tua jika kontak akun lama milik orang tua.',
          'Pilih Profil Anak jika kontak akun lama milik siswa.',
        ]} />
      </Callout>
    </>
  )
}

function StructureTargetButton({ active, description, label, onClick, title }: {
  active: boolean
  description: string
  label: string
  onClick: () => void
  title: string
}) {
  return (
    <button className={active ? 'structure-target active' : 'structure-target'} type="button" onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <span>{active ? 'Terpilih' : label}</span>
    </button>
  )
}

function MigrationStateSummary({ contactOwner, phone }: { contactOwner: Exclude<ContactOwner, null>; phone: string }) {
  const contactLabel = contactOwner === 'parent' ? 'Data Orang Tua' : 'Profil Anak'
  const helper = contactOwner === 'parent' ? 'No. HP akun lama otomatis terisi' : 'Nama, No. HP, Email otomatis terisi'

  return (
    <div className="state-summary" aria-label="Ringkasan mapping akun lama">
      <div>
        <span>Akun lama</span>
        <strong>{existingAccount.name}</strong>
        <small>{phone}</small>
      </div>
      <div>
        <span>Kontak akun lama</span>
        <strong>{contactLabel}</strong>
        <small>{helper}</small>
      </div>
    </div>
  )
}

function ExistingNotRegistered({ setAccountStatus }: { setAccountStatus: (value: AccountStatus) => void }) {
  return (
    <>
      <Callout icon={<AlertCircle size={16} />} variant="danger">
        <strong>No. HP tidak terdaftar sebagai akun Ruangguru</strong>
      </Callout>
      <Callout>
        <strong>Arahkan langkah berikutnya</strong>
        <PointList items={[
          'Daftarkan nomor ini lewat flow Belum Punya Akun.',
          'Jika customer sudah punya akun, minta nomor HP/email login yang lain.',
        ]} />
        <button className="inline-action" type="button" onClick={() => setAccountStatus('new')}>Pindah ke Belum Punya Akun</button>
      </Callout>
    </>
  )
}

function ExistingChildPhone({ setAccountStatus }: { setAccountStatus: (value: AccountStatus) => void }) {
  return (
    <>
      <Callout icon={<AlertCircle size={16} />} variant="danger">
        <strong>No. HP tidak terdaftar sebagai akun Ruangguru</strong>
      </Callout>
      <Callout icon={<AlertCircle size={16} />} variant="danger">
        <strong>No. HP sudah digunakan sebagai No. HP anak</strong>
      </Callout>
      <Callout>
        <strong>Arahkan langkah berikutnya</strong>
        <PointList items={[
          'Nomor anak hanya data profil/kontak, bukan akses login.',
          'Minta nomor HP/email akun jika customer punya akun lama.',
          'Pilih Belum Punya Akun jika nomor ini akan jadi akun orang tua baru.',
        ]} />
        <button className="inline-action" type="button" onClick={() => setAccountStatus('new')}>Pindah ke Belum Punya Akun</button>
      </Callout>
    </>
  )
}

function NewAvailableAccount({ isChildContact = false, phone }: { isChildContact?: boolean; phone: string }) {
  return (
    <>
      <Callout icon={<CheckCircle2 size={16} />} variant="success">
        <strong>No. HP belum terdaftar sebagai akun Ruangguru. Lanjutkan pembelian ke tahap 3.</strong>
        <p>Nomor {phone} dapat digunakan untuk membuat Akun Orang Tua baru.</p>
      </Callout>
      {isChildContact && (
        <Callout>
          <strong>Catatan</strong>
          <PointList items={[
            'Nomor ini sebelumnya terdeteksi sebagai No. HP Profil Anak.',
            'Profil Anak bukan akun Ruangguru dan tidak bisa dipakai login.',
            'Nomor ini tetap bisa menjadi akun orang tua baru.',
          ]} />
        </Callout>
      )}
    </>
  )
}

function NewRegisteredAccount({ phone, setAccountStatus }: { phone: string; setAccountStatus: (value: AccountStatus) => void }) {
  const registeredAccount = getRegisteredParentAccount(phone) ?? existingAccount

  return (
    <>
      <Callout icon={<AlertCircle size={16} />} variant="danger">
        <strong>No. HP sudah terdaftar sebagai akun Ruangguru</strong>
      </Callout>
      <AccountResult name={registeredAccount.name} phone={phone} />
      <Callout>
        <strong>Arahkan langkah berikutnya</strong>
        <PointList items={[
          'Nomor ini sudah punya akun Ruangguru.',
          'Pindahkan ke flow Sudah Punya Akun untuk memilih profil tujuan paket atau memproses migrasi.',
        ]} />
        <button className="inline-action" type="button" onClick={() => setAccountStatus('existing')}>Pindah ke Sudah Punya Akun</button>
      </Callout>
    </>
  )
}

function AccountResult({ name, phone }: { name: string; phone: string }) {
  return (
    <div className="account-result">
      <div className="student-photo" />
      <div>
        <strong>{name}</strong>
        <span>{phone}</span>
      </div>
    </div>
  )
}

function ToggleRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button className={checked ? 'toggle-row on' : 'toggle-row'} type="button" onClick={onClick}>
      <span>{label}</span>
      <span className="switch" aria-hidden="true" />
    </button>
  )
}

function AccountForm({
  childEmail,
  childName,
  childPhone,
  grade,
  mode,
  parentName,
  parentPhone,
  usesParentIdentity,
  setChildEmail,
  setChildName,
  setChildPhone,
  setGrade,
  setParentName,
  setParentPhone,
}: AccountFormProps) {
  const isMigration = mode === 'migration'
  const shouldCheckParentPhone = isMigration && !usesParentIdentity
  const parentPhoneAccount = shouldCheckParentPhone ? getRegisteredParentAccount(parentPhone) : null
  const parentPhoneIsCheckable = shouldCheckParentPhone && canCheckParentPhone(parentPhone)
  const shouldPrefillParentName = Boolean(parentPhoneAccount && !parentName)
  const parentNameValue = shouldPrefillParentName ? parentPhoneAccount?.name ?? '' : parentName

  return (
    <div className="form-fields">
      <h4>Data Orang Tua</h4>
      <TextField
        helper={usesParentIdentity ? 'Otomatis terisi dari No. HP akun lama yang hanya melekat ke satu akun.' : undefined}
        label="No. HP Orang Tua"
        placeholder="Masukan no. HP orang tua"
        value={parentPhone}
        onChange={setParentPhone}
      />
      {shouldCheckParentPhone && parentPhoneIsCheckable && (
        <ParentPhoneCheckResult account={parentPhoneAccount} phone={parentPhone} />
      )}
      <TextField
        helper={shouldPrefillParentName ? 'Otomatis terisi dari akun yang ditemukan melalui No. HP Orang Tua.' : undefined}
        label="Nama Orang Tua"
        placeholder="Masukan nama lengkap orang tua"
        readOnly={shouldPrefillParentName}
        value={parentNameValue}
        onChange={setParentName}
      />
      <h4>Data Profil Anak</h4>
      <TextField label="Nama Lengkap Anak" placeholder="Masukan nama lengkap anak" value={childName} onChange={setChildName} />
      <SelectField label="Kelas" value={grade} onChange={setGrade} />
      <TextField
        helper="No. HP anak hanya untuk data profil/kontak, bukan akses login utama. Nomor boleh sama dengan milik orang tua."
        label="No. HP Anak"
        placeholder="Masukan no. HP anak (opsional)"
        value={childPhone}
        onChange={setChildPhone}
      />
      <TextField
        helper="Email anak hanya untuk data profil/kontak, bukan akses login utama. Email boleh sama dengan milik orang tua."
        label="Email Anak"
        placeholder="Masukan email anak (opsional)"
        value={childEmail}
        onChange={setChildEmail}
      />
      <Callout className="strong">
        <strong>Yang perlu diberitahu ke anak/orang tua</strong>
        <PointList items={[
          isMigration ? (usesParentIdentity ? 'No. HP akun lama menjadi Data Orang Tua.' : 'Akun lama akan berubah menjadi Profil Anak.') : 'Profil Anak baru dibuat di bawah Akun Orang Tua.',
          <>No. HP dan Email anak <strong>tidak bisa digunakan login</strong>.</>,
          'Username dan PIN dikirim ke WhatsApp Orang Tua setelah transaksi berhasil.',
        ]} />
      </Callout>
    </div>
  )
}

function ParentPhoneCheckResult({ account, phone }: { account: typeof registeredParentAccount | null; phone: string }) {
  if (!account) {
    return (
      <Callout icon={<CheckCircle2 size={16} />} variant="success">
        <strong>No. HP belum terdaftar sebagai akun Ruangguru</strong>
        <p>Nomor {phone} dapat digunakan untuk membuat Akun Orang Tua baru.</p>
      </Callout>
    )
  }

  return (
    <>
      <Callout icon={<AlertCircle size={16} />} variant="danger">
        <strong>No. HP sudah terdaftar sebagai akun Ruangguru</strong>
      </Callout>
      <AccountResult name={account.name} phone={account.phone} />
      <Callout>
        <strong>Instruksi</strong>
        <PointList items={[
          `Pastikan No. HP ${phone} adalah akun orang tua dan bisa diakses.`,
          <>Jika lanjut, Profil Anak berelasi dengan akun <strong>{account.name}</strong>.</>,
        ]} />
      </Callout>
    </>
  )
}

type AccountFormProps = {
  childEmail: string
  childName: string
  childPhone: string
  grade: string
  mode: 'migration' | 'new'
  parentName: string
  parentPhone: string
  usesParentIdentity: boolean
  setChildEmail: (value: string) => void
  setChildName: (value: string) => void
  setChildPhone: (value: string) => void
  setGrade: (value: string) => void
  setParentName: (value: string) => void
  setParentPhone: (value: string) => void
}

function TextField({ helper, label, onChange, placeholder, readOnly = false, value }: {
  helper?: string
  label: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  value: string
}) {
  return (
    <label>
      {label}
      <input placeholder={placeholder} readOnly={readOnly} value={value} onChange={(event) => onChange?.(event.target.value)} />
      {helper && <small>{helper}</small>}
    </label>
  )
}

function SelectField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Pilih Kelas</option>
        <option>Kelas 10 SMA</option>
        <option>Kelas 11 SMA</option>
        <option>Kelas 12 SMA</option>
      </select>
    </label>
  )
}

function DiscountCard() {
  return (
    <SectionCard className="discount-card" title="Gunakan kode diskon">
      <ActionRow icon={<Check size={18} />} meta="Potongan harga Rp9.000" title="PROMODIWEB" />
    </SectionCard>
  )
}

function ActionRow({ icon, meta, title }: { icon: ReactNode; meta: string; title: string }) {
  return (
    <div className="action-row">
      {icon}
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <ChevronRight size={20} />
    </div>
  )
}

function PaymentDetailCard() {
  return (
    <SectionCard className="payment-card" title="Detail Pembayaran">
      <PaymentRow label="ruangbelajar SMA/SMK 1 Tahun" value="Rp 889.000" />
      <PaymentRow label="Nominal Diskon" value="-Rp 9.000" />
      <p className="policy-text">Dengan menekan tombol di bawah ini, kamu menyatakan</p>
    </SectionCard>
  )
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="payment-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BottomCta({ contextLabel = 'Total Harga', contextValue = 'Rp880.000', disabled, label, onClick }: {
  contextLabel?: string
  contextValue?: string
  disabled: boolean
  label: string
  onClick: () => void
}) {
  const isContextual = contextLabel !== 'Total Harga'

  return (
    <footer className={isContextual ? 'bottom-cta contextual-cta' : 'bottom-cta'}>
      <div>
        <span>{contextLabel}</span>
        <strong>{contextValue}</strong>
      </div>
      <button disabled={disabled} type="button" onClick={onClick}>{label}</button>
    </footer>
  )
}

function ReviewSheet({ accountStatus, childName, consent, grade, lookupState, parentName, parentPhone, phone, profileTarget, selectedChildProfileId, setConsent, usesParentIdentity, onClose, onContinue }: {
  accountStatus: AccountStatus | null
  childName: string
  consent: boolean
  grade: string
  lookupState: LookupState
  parentName: string
  parentPhone: string
  phone: string
  profileTarget: ProfileTarget
  selectedChildProfileId: string
  setConsent: (value: boolean) => void
  usesParentIdentity: boolean
  onClose: () => void
  onContinue: () => void
}) {
  const isNewAccount = accountStatus === 'new' && lookupState === 'new-available'
  const parentAccount = getLookupParentAccount(lookupState)
  const selectedProfile = parentAccount?.profiles.find((profile) => profile.id === selectedChildProfileId)
  const parentLabel = usesParentIdentity ? parentName || 'Orang tua dari data akun lama' : parentName || 'Orang tua'
  const parentNumberLabel = usesParentIdentity ? phone : parentPhone || phone || 'yang diisi agent'
  const parentDisplayName = parentAccount?.name ?? parentLabel
  const parentDisplayPhone = parentAccount?.phone ?? parentNumberLabel
  const targetProfileName = parentAccount
    ? profileTarget === 'existing' && selectedProfile
      ? selectedProfile.name
      : childName || 'Profil Anak baru'
    : isNewAccount || usesParentIdentity
      ? childName || 'Profil Anak baru'
      : existingAccount.name
  const targetGrade = parentAccount && profileTarget === 'existing' && selectedProfile ? selectedProfile.grade : grade || '-'
  const usesExistingProfile = Boolean(parentAccount && profileTarget === 'existing' && selectedProfile)
  const reviewType = parentAccount ? 'Aktivasi paket' : isNewAccount ? 'Pembuatan akun' : 'Konversi akun'
  const title = parentAccount ? 'Review tujuan paket' : isNewAccount ? 'Review pembuatan akun' : 'Review migrasi akun'
  const reviewNote = parentAccount
    ? usesExistingProfile
      ? 'Paket akan aktif di profil yang dipilih. Akses profil tidak berubah.'
      : 'Profil baru akan dibuat sebelum paket diaktifkan.'
    : isNewAccount
      ? 'Struktur Akun Orang Tua dan Profil Anak baru akan dibuat.'
      : usesParentIdentity
        ? 'Data akun lama dipakai sebagai Akun Orang Tua.'
        : 'Akun lama akan dikonversi menjadi Profil Anak.'
  const accessValue = usesExistingProfile ? 'Tidak berubah' : 'Username + PIN'
  const accessCopy = usesExistingProfile ? 'Gunakan akses profil yang sudah ada.' : parentAccount || isNewAccount ? 'Username dan PIN dikirim ke WhatsApp Orang Tua.' : 'Login anak berubah ke Username dan PIN.'
  const consentCopy = usesExistingProfile ? 'Tujuan paket sudah dikonfirmasi ke customer.' : 'Perubahan akses login dan pemrosesan data sudah dijelaskan ke customer.'

  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="wizard-review scan-review sheet-review">
        <section className="review-hero" aria-label="Ringkasan tujuan paket">
          <span>{reviewType}</span>
          <strong>{targetProfileName}</strong>
          <p>{reviewNote}</p>
        </section>

        <div className="review-facts" aria-label="Detail review">
          <ReviewFact label="Akun Orang Tua" value={parentDisplayName} meta={parentDisplayPhone} />
          <ReviewFact label="Profil Tujuan" value={targetProfileName} meta={targetGrade} />
          <ReviewFact label="Akses Anak" value={accessValue} meta={accessCopy} />
        </div>

        <section className="review-checklist" aria-label="Yang perlu dipastikan">
          <h4>Pastikan sebelum lanjut</h4>
          <ReviewCheckItem>Profil tujuan paket sudah sesuai dengan customer.</ReviewCheckItem>
          {selectedProfile?.hasActivePackage && <ReviewCheckItem warning>Profil ini sudah punya paket aktif. Konfirmasi renewal atau upgrade.</ReviewCheckItem>}
          {usesExistingProfile ? <ReviewCheckItem>Akses profil anak tetap mengikuti pengaturan yang sudah ada.</ReviewCheckItem> : <ReviewCheckItem>No. HP/email anak hanya tersimpan sebagai data profil.</ReviewCheckItem>}
        </section>

        <label className="consent-row review-consent">
          <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
          <span>{consentCopy}</span>
        </label>
      </div>
      <button className="sheet-primary" disabled={!consent} type="button" onClick={onContinue}>Lanjut Pilih Metode Bayar</button>
    </BottomSheet>
  )
}

function BottomSheet({ children, onClose, title }: { children: ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="sheet-backdrop">
      <section className="bottom-sheet">
        {title && (
          <div className="sheet-header">
            <h2>{title}</h2>
            <button type="button" aria-label="Tutup" onClick={onClose}><X size={18} /></button>
          </div>
        )}
        {children}
      </section>
    </div>
  )
}


function DoneSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="success-sheet">
        <div className="success-mark"><Check size={26} /></div>
        <h2>Prototype sampai titik metode bayar</h2>
        <p>Di produksi, agent akan diarahkan ke pilihan metode bayar setelah review migrasi disetujui.</p>
        <button className="sheet-primary" type="button" onClick={onClose}>Kembali ke Draft Invoice</button>
      </div>
    </BottomSheet>
  )
}

export default App
