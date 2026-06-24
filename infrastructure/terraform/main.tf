terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0" # pin and verify against the current provider docs before applying
    }
  }
}

variable "cloudflare_api_token" { sensitive = true }
variable "cloudflare_account_id" {}
variable "zone_id" {}
variable "vps_ipv4" {}
variable "domain" { default = "reportersdesk.in" }

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# --- Media storage: zero-egress R2 bucket ---
resource "cloudflare_r2_bucket" "media" {
  account_id = var.cloudflare_account_id
  name       = "reportersdesk-media"
  location   = "APAC" # closest available region to an India-based readership
}

# --- DNS: point the apex and www at the VPS running the CMS/API; the
#     frontend itself is on Vercel and managed there, not here. ---
resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  type    = "A"
  content = var.vps_ipv4
  proxied = true # keep traffic behind Cloudflare's WAF/DDoS layer
}

resource "cloudflare_record" "tipline" {
  zone_id = var.zone_id
  name    = "tips"
  type    = "A"
  content = var.vps_ipv4 # placeholder — in practice this should point at the
  proxied = false        # ISOLATED tip-line host's IP, and proxied=false if
                          # you're running it Tor-only with no public DNS at all.
}

# --- WAF: rate-limit the admin login and webhook endpoints specifically,
#     not just rely on Cloudflare's general managed ruleset. ---
resource "cloudflare_ruleset" "login_rate_limit" {
  zone_id     = var.zone_id
  name        = "admin-login-rate-limit"
  description = "Throttle brute-force attempts against the 2FA login routes"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    action = "block"
    expression = "(http.request.uri.path contains \"/api/auth/login\") or (http.request.uri.path contains \"/api/auth/verify-2fa\")"
    ratelimit {
      characteristics     = ["ip.src"]
      period              = 60
      requests_per_period = 10
      mitigation_timeout  = 600
    }
    description = "Max 10 login attempts per IP per minute, 10-minute cooldown"
  }
}

# --- Turnstile: bot protection on the newsletter/payment/poll forms ---
resource "cloudflare_turnstile_widget" "forms" {
  account_id = var.cloudflare_account_id
  name       = "reportersdesk-forms"
  domains    = [var.domain]
  mode       = "managed"
}

output "r2_bucket_name" {
  value = cloudflare_r2_bucket.media.name
}

output "turnstile_site_key" {
  value = cloudflare_turnstile_widget.forms.id
}
