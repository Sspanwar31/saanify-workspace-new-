'use client'

import { motion } from 'framer-motion'
import { Play, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Demo() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Video Thumbnail */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="relative overflow-hidden shadow-2xl rounded-2xl border-0">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center">
                  {/* Video Thumbnail Placeholder */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  
                  {/* Play Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 cursor-pointer"
                  >
                    <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                      <Play className="h-8 w-8 text-indigo-600 ml-1" />
                    </div>
                  </motion.div>

                  {/* Video Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white text-xl font-semibold">
                      See Saanify in Action
                    </h3>
                    <p className="text-white/80 text-sm">
                      3-minute walkthrough of key features
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Transform Your Society Management Today
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                Watch how Saanify simplifies complex operations, enhances member engagement, 
                and drives growth for residential communities across India.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Streamlined Operations</h4>
                  <p className="text-gray-600 text-sm">
                    Automate routine tasks and reduce administrative overhead by 70%
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Enhanced Communication</h4>
                  <p className="text-gray-600 text-sm">
                    Keep members informed with targeted notifications and announcements
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Financial Transparency</h4>
                  <p className="text-gray-600 text-sm">
                    Real-time financial tracking and automated reporting for complete visibility
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300">
                Watch Overview
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}