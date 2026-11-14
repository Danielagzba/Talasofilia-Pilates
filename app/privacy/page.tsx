const privacyEmail = 'talasofiliapilates@gmail.com'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 md:py-20">
      <nav aria-label="Language / Idioma" className="mb-8 flex gap-6">
        <a className="underline" href="#es" lang="es">Español</a>
        <a className="underline" href="#en" lang="en">English</a>
      </nav>
      <article id="es" lang="es" className="space-y-4">
        <h1 className="font-serif text-4xl">Aviso de privacidad</h1>
        <p>Este aviso aplica al sitio web y a la app de Talasofilia Pilates.</p>
        <h2 className="font-serif text-2xl">Responsable y contacto</h2>
        <p>Talasofilia Pilates, con domicilio en Bugambilias 3, Colonia Santa María, Puerto Escondido, Oaxaca, C.P. 70934, México, es responsable del tratamiento de tus datos personales. Puedes escribirnos a <a className="underline" href={'mailto:' + privacyEmail}>{privacyEmail}</a>.</p>
        <h2 className="font-serif text-2xl">Qué datos usamos y para qué</h2>
        <p>Usamos tu nombre, correo electrónico, teléfono si lo proporcionas y datos de autenticación para crear y proteger tu cuenta. Usamos tu historial de reservas y cancelaciones, paquetes, créditos y registros de pago (como importe, estado y referencia) para gestionar tus clases, confirmar pagos y atender incidencias. Si nos contactas, usamos tus datos de contacto y el contenido de tu mensaje para responderte.</p>
        <p>El sitio y la app usan almacenamiento de sesión para mantener tu acceso. La app guarda la sesión en el llavero del dispositivo y recuerda el idioma que seleccionas.</p>
        <h2 className="font-serif text-2xl">Proveedores y divulgación</h2>
        <p>Supabase aloja los datos de la cuenta y presta el servicio de autenticación. Si eliges iniciar sesión con Apple, Apple autentica tu identidad y nos proporciona los datos necesarios para vincular tu cuenta, incluido el correo que decidas compartir. Mercado Pago procesa los pagos de clases y puede recopilar información del dispositivo para prevenir el fraude. Talasofilia recibe la referencia y el resultado del pago. Los datos de la tarjeta se introducen en el servicio de pago. Estos proveedores pueden tratar datos fuera de México. También podemos divulgar datos cuando lo exija la ley.</p>
        <h2 className="font-serif text-2xl">Conservación y tus derechos</h2>
        <p>Conservamos los datos mientras sean necesarios para gestionar tu cuenta, reservas, pagos y solicitudes, y por el tiempo necesario para cumplir obligaciones legales o resolver controversias. Puedes solicitar acceso, rectificación, cancelación u oposición (derechos ARCO), revocar tu consentimiento o pedir que limitemos el uso o divulgación de tus datos. Escríbenos al correo de contacto e indica tu nombre, el correo asociado a tu cuenta, qué datos y derecho se relacionan con tu solicitud y dónde podemos responderte. Podemos pedirte que verifiques tu identidad.</p>
        <p>Si tu versión de la app incluye la opción, puedes iniciar la eliminación de tu cuenta compartida desde <strong>Perfil → Eliminar cuenta</strong>. La app indica el plazo aplicable al enviar tu solicitud. La eliminación está sujeta a las obligaciones de conservación aplicables.</p>
        <p>Publicaremos los cambios a este aviso en esta página.</p>
      </article>
      <article id="en" lang="en" className="mt-12 space-y-4 border-t pt-10">
        <h2 className="font-serif text-4xl">Privacy Policy</h2>
        <p>This policy covers the Talasofilia Pilates website and app.</p>
        <h3 className="font-serif text-2xl">Who we are and how to contact us</h3>
        <p>Talasofilia Pilates, at Bugambilias 3, Colonia Santa María, Puerto Escondido, Oaxaca, C.P. 70934, Mexico, is responsible for handling your personal data. Email us at <a className="underline" href={'mailto:' + privacyEmail}>{privacyEmail}</a>.</p>
        <h3 className="font-serif text-2xl">What we use and why</h3>
        <p>We use your name, email address, phone number if provided, and authentication information to create and protect your account. We use booking and cancellation history, class packages, credits, and payment records such as amount, status, and reference to manage classes, confirm payments, and resolve issues. If you contact us, we use your contact details and message to reply.</p>
        <p>The website and app use session storage to keep you signed in. The app stores your session in the device Keychain and remembers your language preference.</p>
        <h3 className="font-serif text-2xl">Service providers and disclosure</h3>
        <p>Supabase hosts account data and provides authentication. If you choose Sign in with Apple, Apple verifies your identity and provides the information we need to link your account, including the email address you choose to share. Mercado Pago processes class payments and may collect device information to prevent fraud. Talasofilia receives the payment reference and outcome. Card details are entered in the payment service. These providers may process data outside Mexico. We may also disclose data when required by law.</p>
        <h3 className="font-serif text-2xl">Retention and your rights</h3>
        <p>We keep data while needed to manage your account, bookings, payments, and requests, and as needed to meet legal obligations or resolve disputes. You can request access, correction, deletion, or object to processing (ARCO rights), withdraw consent, or ask us to limit use or disclosure of your data. Email us with your name, the email associated with your account, the data and right your request concerns, and where we can reply. We may ask you to verify your identity.</p>
        <p>If the option is available in your app version, go to <strong>Profile → Delete Account</strong> to request deletion of your shared account. The app shows the applicable timeline when you submit the request. Deletion is subject to applicable retention obligations.</p>
        <p>We will post updates to this policy on this page.</p>
      </article>
    </main>
  )
}
