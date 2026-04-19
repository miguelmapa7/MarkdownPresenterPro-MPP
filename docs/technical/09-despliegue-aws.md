# 9. Despliegue en AWS — Guía Detallada

## Arquitectura de Hosting

```
Usuario (navegador)
    │
    ▼
CloudFront (CDN + HTTPS + Caché)
    │
    ▼
S3 Bucket (archivos estáticos)
```

---

## Servicio 1: Amazon S3 (Simple Storage Service)

### ¿Qué es?

S3 es un servicio de almacenamiento de objetos de AWS. Piensa en él como un disco duro en la nube donde guardas archivos. Cada archivo se llama "objeto" y se organiza en "buckets" (contenedores).

### ¿Para qué lo usamos en MPP?

Almacena los archivos estáticos de la versión web: `index.html`, archivos JavaScript, CSS y assets. S3 no ejecuta código — solo almacena y sirve archivos.

### Configuración implementada:

**Crear el bucket:**

```bash
# Crear bucket S3 con nombre único globalmente
aws s3 mb s3://YOUR_S3_BUCKET --region us-east-1
```

- `mb` = make bucket
- El nombre debe ser único en TODO AWS (no solo tu cuenta)
- `us-east-1` = región Virginia del Norte (requerida para CloudFront)

**Bloquear acceso público:**

```bash
# Bloquear todo acceso público al bucket
aws s3api put-public-access-block \
  --bucket YOUR_S3_BUCKET \
  --public-access-block-configuration \
    BlockPublicAcls=true,\
    IgnorePublicAcls=true,\
    BlockPublicPolicy=true,\
    RestrictPublicBuckets=true
```

- Nadie puede acceder directamente al bucket por URL de S3
- Solo CloudFront puede leer los archivos (via OAC)
- Esto es una práctica de seguridad obligatoria

**Subir archivos:**

```bash
# Sincronizar archivos locales con el bucket
aws s3 sync dist-web/ s3://YOUR_S3_BUCKET --delete
```

- `sync` = sube solo archivos nuevos o modificados
- `--delete` = elimina del bucket archivos que ya no existen localmente
- `dist-web/` = carpeta generada por `npm run build:web`

**Verificar contenido:**

```bash
# Listar archivos en el bucket
aws s3 ls s3://YOUR_S3_BUCKET --recursive
```

### Costos:

- Free Tier (12 meses): 5 GB almacenamiento, 20,000 GET requests/mes
- Nuestra app: ~500 KB — 0.01% del límite
- Después del Free Tier: ~$0.023/GB/mes = ~$0.00001/mes para 500KB

---

## Servicio 2: Amazon CloudFront (CDN)

### ¿Qué es?

CloudFront es una Red de Distribución de Contenido (CDN). Copia tus archivos en servidores distribuidos por todo el mundo ("edge locations"). Cuando un usuario accede a tu app, CloudFront le sirve los archivos desde el servidor más cercano, reduciendo la latencia.

### ¿Para qué lo usamos en MPP?

- **HTTPS**: CloudFront provee certificado SSL gratuito (`*.cloudfront.net`)
- **CDN**: Baja latencia global
- **Caché**: Reduce requests a S3
- **Compresión**: gzip/brotli automático
- **SPA routing**: Redirige errores 403/404 a `index.html`

### Configuración implementada:

**Crear distribución (desde la consola web):**

1. CloudFront → Create distribution
2. Origin: bucket S3 `YOUR_S3_BUCKET`
3. Origin Access Control (OAC): habilitado — solo CloudFront accede al bucket
4. Default root object: `index.html`
5. Compresión: habilitada

**Configurar páginas de error para SPA:**
Nuestra app es una Single Page Application. Cuando el usuario navega a una ruta como `/slides/3`, no existe un archivo `/slides/3` en S3. Sin configuración, CloudFront devolvería un error 403. Con las páginas de error personalizadas, redirige a `index.html` y React maneja la ruta.

| Error HTTP      | Redirige a    | Código de respuesta |
| --------------- | ------------- | ------------------- |
| 403 (Forbidden) | `/index.html` | 200 (OK)            |
| 404 (Not Found) | `/index.html` | 200 (OK)            |

**Configurar default root object:**
En General → Settings → Edit → Default root object: `index.html`
Esto hace que cuando alguien accede a `https://d1234.cloudfront.net/`, CloudFront sirva `index.html` automáticamente.

**Invalidar caché después de un despliegue:**

```bash
# Invalidar caché de index.html para que usuarios vean la versión nueva
aws cloudfront create-invalidation \
  --distribution-id YOUR_CLOUDFRONT_ID \
  --paths "/index.html"
```

- Solo invalidamos `index.html` porque los archivos JS/CSS tienen hash en el nombre
- Cuando cambias el código, Vite genera nuevos hashes → nuevos archivos → no necesitan invalidación
- `index.html` referencia los nuevos archivos con hash → al invalidarlo, los usuarios cargan la versión nueva

**Ver estado de la distribución:**

```bash
# Ver detalles de la distribución
aws cloudfront get-distribution --id YOUR_CLOUDFRONT_ID
```

### URL de acceso:

Tu app web estará disponible en: `https://XXXXXX.cloudfront.net`
(El dominio exacto se muestra en la consola de CloudFront → Distribution domain name)

### Costos:

- Free Tier (siempre, no expira): 1 TB transferencia/mes, 10,000,000 requests/mes
- Nuestra app: ~500KB por carga × pocas visitas = prácticamente $0

---

## Servicio 3: AWS IAM (Identity and Access Management)

### ¿Qué es?

IAM gestiona quién puede hacer qué en tu cuenta de AWS. Permite crear usuarios con permisos específicos en vez de usar la cuenta raíz (que tiene acceso a todo).

### ¿Para qué lo usamos en MPP?

Creamos un usuario `mpp-deploy` con permisos mínimos: solo puede subir archivos a nuestro bucket S3 e invalidar caché de CloudFront. No puede crear otros recursos, borrar la cuenta, ni acceder a otros servicios.

### Configuración implementada:

**Política de permisos (`MPP-Deploy-Policy`):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketCreation",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketPolicy",
        "s3:GetBucketPublicAccessBlock"
      ],
      "Resource": "arn:aws:s3:::YOUR_S3_BUCKET"
    },
    {
      "Sid": "S3DeployAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_S3_BUCKET",
        "arn:aws:s3:::YOUR_S3_BUCKET/*"
      ]
    },
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution"
      ],
      "Resource": "*"
    }
  ]
}
```

**Principio de mínimo privilegio**: El usuario solo tiene los permisos estrictamente necesarios. Si las credenciales se filtran, el atacante solo puede subir archivos a un bucket específico — no puede borrar la cuenta ni acceder a otros servicios.

**Configurar credenciales en la terminal:**

```bash
aws configure
# AWS Access Key ID: (tu access key)
# AWS Secret Access Key: (tu secret key)
# Default region name: us-east-1
# Default output format: json
```

### Costos:

- Siempre gratis. IAM no tiene costo.

---

## Servicio 4: AWS Budgets (Presupuestos)

### ¿Qué es?

AWS Budgets permite crear alertas de gasto. Te notifica por email si tus costos superan un umbral definido.

### ¿Para qué lo usamos en MPP?

Configuramos un presupuesto de "gasto cero" que envía una alerta si cualquier cargo supera $0.01 USD. Es una red de seguridad para evitar costos inesperados.

### Configuración implementada:

- Nombre: `My Zero-Spend Budget`
- Tipo: Presupuesto de gasto cero
- Umbral: $1.00 USD (alerta al superar $0.01)
- Notificación: Email

### Costos:

- Los primeros 2 presupuestos son gratis. Solo se cobra a partir del tercero.

---

## Proceso Completo de Despliegue

### Despliegue manual (paso a paso):

```bash
# Paso 1: Construir la versión web
npm run build:web

# Paso 2: Verificar que se generaron los archivos
ls dist-web/

# Paso 3: Subir a S3
aws s3 sync dist-web/ s3://YOUR_S3_BUCKET --delete

# Paso 4: Invalidar caché de CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_CLOUDFRONT_ID \
  --paths "/index.html"

# Paso 5: Verificar (esperar ~2 minutos para propagación)
# Abrir en el navegador: https://XXXXXX.cloudfront.net
```

### Despliegue automático (CI/CD):

Cada push a la rama `main` ejecuta automáticamente los pasos 1-4 via GitHub Actions. Los secrets necesarios en GitHub:

| Secret                       | Valor                               | Dónde obtenerlo                                 |
| ---------------------------- | ----------------------------------- | ----------------------------------------------- |
| `AWS_ACCESS_KEY_ID`          | Access key del usuario `mpp-deploy` | IAM → Users → mpp-deploy → Security credentials |
| `AWS_SECRET_ACCESS_KEY`      | Secret key del usuario `mpp-deploy` | Se mostró al crear la access key                |
| `S3_BUCKET_NAME`             | `YOUR_S3_BUCKET`           | S3 → nombre del bucket                          |
| `CLOUDFRONT_DISTRIBUTION_ID` | `YOUR_CLOUDFRONT_ID`                     | CloudFront → Distribution ID                    |

---

## Política de Caché

| Tipo de archivo  | Cache-Control                 | TTL   | ¿Por qué?                                               |
| ---------------- | ----------------------------- | ----- | ------------------------------------------------------- |
| `index.html`     | `max-age=0, must-revalidate`  | 0     | Siempre debe ser la versión más reciente                |
| `assets/*.js`    | `max-age=31536000, immutable` | 1 año | Hash en el nombre — si cambia el código, cambia el hash |
| `assets/*.css`   | `max-age=31536000, immutable` | 1 año | Hash en el nombre — si cambia el código, cambia el hash |
| Imágenes/fuentes | `max-age=31536000`            | 1 año | Raramente cambian                                       |

### ¿Cómo funciona?

Vite genera archivos con hash: `index-a1b2c3.js`. Cuando cambias el código, el hash cambia → nuevo archivo → el navegador lo descarga. El `index.html` (sin hash) referencia los archivos con hash. Al invalidar `index.html`, los usuarios cargan la nueva versión que apunta a los nuevos archivos.

---

## Seguridad

| Medida                           | Implementación                                         |
| -------------------------------- | ------------------------------------------------------ |
| Acceso público bloqueado en S3   | `put-public-access-block` con las 4 opciones activadas |
| Solo CloudFront accede a S3      | Origin Access Control (OAC)                            |
| HTTPS obligatorio                | Certificado CloudFront (`*.cloudfront.net`)            |
| Usuario IAM con permisos mínimos | Política `MPP-Deploy-Policy`                           |
| Alerta de costos                 | Presupuesto de gasto cero con notificación email       |
| Credenciales no en código        | GitHub Secrets para CI/CD                              |

---

## Resumen de Costos

| Servicio   | Free Tier | Límite              | Nuestro uso   | Costo mensual |
| ---------- | --------- | ------------------- | ------------- | ------------- |
| S3         | 12 meses  | 5 GB + 20K GET      | ~500 KB       | $0            |
| CloudFront | Siempre   | 1 TB + 10M requests | Mínimo        | $0            |
| IAM        | Siempre   | Ilimitado           | 1 usuario     | $0            |
| Budgets    | Siempre   | 2 presupuestos      | 1 presupuesto | $0            |
| **Total**  |           |                     |               | **$0**        |
