# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - button "Close login" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img [ref=e17]
        - generic [ref=e19]:
          - heading "Welcome to Esparex" [level=4] [ref=e20]
          - paragraph [ref=e21]: Login to buy & sell mobile spares
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: Mobile Number
          - generic [ref=e26]:
            - generic: "+91"
            - textbox "Mobile number" [ref=e27]:
              - /placeholder: "9876543210"
              - text: "9030787819"
          - alert [ref=e28]: Too many OTP requests Try again in 21:23.
        - generic [ref=e29]:
          - button "Send OTP (21:23)" [disabled]
        - button "Back" [ref=e30] [cursor=pointer]:
          - img [ref=e31]
          - text: Back
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e38] [cursor=pointer]:
    - img [ref=e39]
  - alert [ref=e42]
```